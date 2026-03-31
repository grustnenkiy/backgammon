import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { registerGameHandlers, DISCONNECT_GRACE_MS } from '../socket/registerGameHandlers.js';
import { clearRooms } from '../rooms/roomStore.js';
import type { RoomState, Move } from 'shared';

let httpServer: ReturnType<typeof createServer>;
let io: Server;
let port: number;

function createClient(): ClientSocket {
  return ioClient(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
  });
}

function waitFor<T>(socket: ClientSocket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (data: T) => resolve(data));
  });
}

function connectClient(): Promise<ClientSocket> {
  const client = createClient();
  return new Promise((resolve) => {
    client.on('connect', () => resolve(client));
  });
}

beforeAll(
  () =>
    new Promise<void>((resolve) => {
      httpServer = createServer();
      io = new Server(httpServer);

      io.on('connection', (socket) => {
        registerGameHandlers(io, socket);
      });

      httpServer.listen(0, '127.0.0.1', () => {
        const addr = httpServer.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    }),
);

afterAll(
  () =>
    new Promise<void>((resolve) => {
      io.close();
      httpServer.close(() => resolve());
    }),
);

beforeEach(() => {
  clearRooms();
});

describe('create_game', () => {
  it('creates a room and returns it', async () => {
    const client = await connectClient();
    try {
      const roomPromise = waitFor<RoomState>(client, 'game_created');
      client.emit('create_game');
      const room = await roomPromise;

      expect(room.roomId).toBeTypeOf('string');
      expect(room.players.white).toBe(client.id);
      expect(room.players.black).toBeUndefined();
      expect(room.game.status).toBe('waiting');
    } finally {
      client.disconnect();
    }
  });
});

describe('join_game', () => {
  it('joins an existing room as black', async () => {
    const host = await connectClient();
    const guest = await connectClient();
    try {
      const createPromise = waitFor<RoomState>(host, 'game_created');
      host.emit('create_game');
      const created = await createPromise;

      const hostStatePromise = waitFor<RoomState>(host, 'game_state');
      const guestStatePromise = waitFor<RoomState>(guest, 'game_state');
      guest.emit('join_game', created.roomId);

      const [hostState, guestState] = await Promise.all([hostStatePromise, guestStatePromise]);

      expect(guestState.players.black).toBe(guest.id);
      expect(guestState.game.status).toBe('playing');
      expect(hostState.players.black).toBe(guest.id);
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });

  it('returns error for non-existent room', async () => {
    const client = await connectClient();
    try {
      const errPromise = waitFor<{ message: string }>(client, 'game_error');
      client.emit('join_game', 'bad-room');
      const err = await errPromise;

      expect(err.message).toBe('Room not found');
    } finally {
      client.disconnect();
    }
  });
});

describe('get_game_state', () => {
  it('returns current room state', async () => {
    const host = await connectClient();
    try {
      const createPromise = waitFor<RoomState>(host, 'game_created');
      host.emit('create_game');
      const created = await createPromise;

      const statePromise = waitFor<RoomState>(host, 'game_state');
      host.emit('get_game_state', created.roomId);
      const state = await statePromise;

      expect(state.roomId).toBe(created.roomId);
      expect(state.game.points).toHaveLength(24);
    } finally {
      host.disconnect();
    }
  });

  it('returns error for non-existent room', async () => {
    const client = await connectClient();
    try {
      const errPromise = waitFor<{ message: string }>(client, 'game_error');
      client.emit('get_game_state', 'bad-room');
      const err = await errPromise;

      expect(err.message).toBe('Room not found');
    } finally {
      client.disconnect();
    }
  });
});

describe('roll_dice', () => {
  async function setupGame() {
    const host = await connectClient();
    const guest = await connectClient();

    const createPromise = waitFor<RoomState>(host, 'game_created');
    host.emit('create_game');
    const created = await createPromise;

    const joinPromise = waitFor<RoomState>(host, 'game_state');
    guest.emit('join_game', created.roomId);
    await joinPromise;

    return { host, guest, roomId: created.roomId };
  }

  it('rolls dice for the current player', async () => {
    const { host, guest, roomId } = await setupGame();
    try {
      // White (host) goes first
      const statePromise = waitFor<RoomState>(host, 'game_state');
      host.emit('roll_dice', roomId);
      const state = await statePromise;

      expect(state.game.dice.length).toBeGreaterThanOrEqual(2);
      expect(state.game.dice.every((d: number) => d >= 1 && d <= 6)).toBe(true);
      expect(state.game.usedDice).toEqual([]);
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });

  it('returns error when not your turn', async () => {
    const { host, guest, roomId } = await setupGame();
    try {
      // Guest is black, white goes first
      const errPromise = waitFor<{ message: string }>(guest, 'game_error');
      guest.emit('roll_dice', roomId);
      const err = await errPromise;

      expect(err.message).toBe('Not your turn');
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });

  it('returns error when dice already rolled', async () => {
    const { host, guest, roomId } = await setupGame();
    try {
      // Roll once
      const firstRoll = waitFor<RoomState>(host, 'game_state');
      host.emit('roll_dice', roomId);
      await firstRoll;

      // Try to roll again
      const errPromise = waitFor<{ message: string }>(host, 'game_error');
      host.emit('roll_dice', roomId);
      const err = await errPromise;

      expect(err.message).toBe('Already rolled');
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });

  it('produces doubles (4 dice) when both values match', async () => {
    const { host, guest, roomId } = await setupGame();
    try {
      // Keep rolling until we get doubles or exhaust attempts
      let gotDoubles = false;
      for (let i = 0; i < 100; i++) {
        clearRooms();
        // Re-setup each time
        const h2 = await connectClient();
        const g2 = await connectClient();
        const cp = waitFor<RoomState>(h2, 'game_created');
        h2.emit('create_game');
        const c = await cp;
        const jp = waitFor<RoomState>(h2, 'game_state');
        g2.emit('join_game', c.roomId);
        await jp;

        const sp = waitFor<RoomState>(h2, 'game_state');
        h2.emit('roll_dice', c.roomId);
        const s = await sp;
        h2.disconnect();
        g2.disconnect();

        if (s.game.dice.length === 4) {
          gotDoubles = true;
          expect(s.game.dice[0]).toBe(s.game.dice[1]);
          expect(s.game.dice[1]).toBe(s.game.dice[2]);
          expect(s.game.dice[2]).toBe(s.game.dice[3]);
          break;
        }
      }
      expect(gotDoubles).toBe(true);
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });
});

describe('move_checker', () => {
  async function setupGameWithDice() {
    const host = await connectClient();
    const guest = await connectClient();

    const createPromise = waitFor<RoomState>(host, 'game_created');
    host.emit('create_game');
    const created = await createPromise;

    const joinPromise = waitFor<RoomState>(host, 'game_state');
    guest.emit('join_game', created.roomId);
    await joinPromise;

    // Roll dice for white
    const rollPromise = waitFor<RoomState>(host, 'game_state');
    host.emit('roll_dice', created.roomId);
    const state = await rollPromise;

    return { host, guest, roomId: created.roomId, state };
  }

  it('applies a valid move', async () => {
    const { host, guest, roomId, state } = await setupGameWithDice();
    try {
      const { getValidMoves } = await import('shared');
      let move: Move | null = null;

      if (state.game.bar.white > 0) {
        move = getValidMoves(state.game, 'bar')[0] ?? null;
      } else {
        for (let p = 0; p < 24 && !move; p++) {
          const point = state.game.points[p];
          if (point && point.player === 'white' && point.count > 0) {
            move = getValidMoves(state.game, p)[0] ?? null;
          }
        }
      }

      expect(move).not.toBeNull();

      const statePromise = waitFor<RoomState>(host, 'game_state');
      host.emit('move_checker', roomId, move!);
      const nextState = await statePromise;

      expect(nextState.game.usedDice).toContain(move!.die);
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });

  it('rejects invalid move', async () => {
    const { host, guest, roomId } = await setupGameWithDice();
    try {
      // Try a move with a die value not rolled
      const move: Move = { from: 0, to: 0, die: 99 };
      const errPromise = waitFor<{ message: string }>(host, 'game_error');
      host.emit('move_checker', roomId, move);
      const err = await errPromise;

      expect(err.message).toBe('Invalid move');
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });

  it('rejects move from wrong player', async () => {
    const { host, guest, roomId, state } = await setupGameWithDice();
    try {
      const die = state.game.dice[0]!;
      const move: Move = { from: 23, to: 23 - die, die };
      const errPromise = waitFor<{ message: string }>(guest, 'game_error');
      guest.emit('move_checker', roomId, move);
      const err = await errPromise;

      expect(err.message).toBe('Not your turn');
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });

  it('switches turn when all dice are used', async () => {
    const host = await connectClient();
    const guest = await connectClient();
    try {
      const createPromise = waitFor<RoomState>(host, 'game_created');
      host.emit('create_game');
      const created = await createPromise;

      const joinPromise = waitFor<RoomState>(host, 'game_state');
      guest.emit('join_game', created.roomId);
      await joinPromise;

      // Roll
      const rollPromise = waitFor<RoomState>(host, 'game_state');
      host.emit('roll_dice', created.roomId);
      const rolled = await rollPromise;

      // If the turn was auto-switched (no valid moves), test is satisfied
      if (rolled.game.currentTurn === 'black') {
        expect(rolled.game.dice).toEqual([]);
        return;
      }

      const { getValidMoves } = await import('shared');
      let currentState = rolled;

      // Use all dice by finding valid moves dynamically
      for (let i = 0; i < rolled.game.dice.length; i++) {
        // Find any valid move for the current player
        let foundMove: Move | null = null;
        if (currentState.game.bar.white > 0) {
          const barMoves = getValidMoves(currentState.game, 'bar');
          if (barMoves.length > 0) foundMove = barMoves[0]!;
        } else {
          for (let p = 0; p < 24 && !foundMove; p++) {
            const pt = currentState.game.points[p];
            if (pt && pt.player === 'white' && pt.count > 0) {
              const moves = getValidMoves(currentState.game, p);
              if (moves.length > 0) foundMove = moves[0]!;
            }
          }
        }

        if (!foundMove) break; // no more moves, server will auto-switch

        const sp = waitFor<RoomState>(host, 'game_state');
        host.emit('move_checker', created.roomId, foundMove);
        currentState = await sp;

        // Turn already switched by server
        if (currentState.game.currentTurn === 'black') break;
      }

      // After all dice used (or no more valid moves), turn should switch to black
      expect(currentState.game.currentTurn).toBe('black');
      expect(currentState.game.dice).toEqual([]);
      expect(currentState.game.usedDice).toEqual([]);
    } finally {
      host.disconnect();
      guest.disconnect();
    }
  });
});

describe('disconnect', () => {
  it(
    'notifies the room when a player disconnects',
    async () => {
      const host = await connectClient();
      const guest = await connectClient();
      try {
        const createPromise = waitFor<RoomState>(host, 'game_created');
        host.emit('create_game');
        const created = await createPromise;

        const joinPromise = waitFor<RoomState>(host, 'game_state');
        guest.emit('join_game', created.roomId);
        await joinPromise;

        const disconnectPromise = waitFor<void>(host, 'player_disconnected');
        guest.disconnect();
        await disconnectPromise;

        // If we reach here, host received the event
        expect(true).toBe(true);
      } finally {
        host.disconnect();
      }
    },
    DISCONNECT_GRACE_MS + 3000,
  );
});
