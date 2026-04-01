import { randomUUID } from 'node:crypto';
import type { Server, Socket } from 'socket.io';
import type { GameState, Move, PlayerColor, RoomState } from 'shared';
import { applyMove, getValidMoves, hasAnyValidMoves } from 'shared';
import {
  createRoom,
  getRoom,
  removePlayer,
  deleteRoom,
  isRoomEmpty,
  findRoomsByPlayer,
} from '../rooms/roomStore.js';

function rollDice(): number[] {
  const a = Math.floor(Math.random() * 6) + 1;
  const b = Math.floor(Math.random() * 6) + 1;
  return a === b ? [a, a, a, a] : [a, b];
}

function allDiceUsed(game: GameState): boolean {
  return game.usedDice.length >= game.dice.length;
}

function switchTurn(game: GameState): GameState {
  return {
    ...game,
    currentTurn: game.currentTurn === 'white' ? 'black' : 'white',
    dice: [],
    usedDice: [],
  };
}

function getPlayerColor(room: RoomState, socketId: string): PlayerColor | null {
  if (room.players.white === socketId) return 'white';
  if (room.players.black === socketId) return 'black';
  return null;
}

const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
const roomAuthTokens = new Map<string, { white: string; black?: string }>();

export const DISCONNECT_GRACE_MS = 5000;

type JoinGamePayload = string | { roomId: string; authToken?: string };

function createAuthToken(): string {
  return randomUUID();
}

function cancelDisconnectTimer(roomId: string): void {
  const existing = disconnectTimers.get(roomId);
  if (existing) {
    clearTimeout(existing);
    disconnectTimers.delete(roomId);
  }
}

function parseJoinPayload(payload: JoinGamePayload): { roomId: string; authToken?: string } | null {
  if (typeof payload === 'string') {
    return { roomId: payload };
  }

  if (!payload || typeof payload !== 'object' || typeof payload.roomId !== 'string') {
    return null;
  }

  if (payload.authToken !== undefined && typeof payload.authToken !== 'string') {
    return null;
  }

  if (payload.authToken === undefined) {
    return { roomId: payload.roomId };
  }

  return { roomId: payload.roomId, authToken: payload.authToken };
}

export function registerGameHandlers(io: Server, socket: Socket) {
  socket.on('create_game', () => {
    const room = createRoom(socket.id);
    const whiteAuthToken = createAuthToken();
    roomAuthTokens.set(room.roomId, { white: whiteAuthToken });

    socket.join(room.roomId);
    socket.emit('player_session', {
      roomId: room.roomId,
      color: 'white' as PlayerColor,
      authToken: whiteAuthToken,
    });
    socket.emit('game_created', room);
  });

  socket.on('join_game', (payload: JoinGamePayload) => {
    const parsed = parseJoinPayload(payload);
    if (!parsed) {
      socket.emit('game_error', { message: 'Invalid join payload' });
      return;
    }

    const { roomId, authToken } = parsed;
    const room = getRoom(roomId);

    if (!room) {
      socket.emit('game_error', { message: 'Room not found' });
      return;
    }

    const auth = roomAuthTokens.get(roomId);
    if (!auth) {
      socket.emit('game_error', { message: 'Room not found' });
      return;
    }

    const existingColor = getPlayerColor(room, socket.id);
    if (existingColor) {
      cancelDisconnectTimer(roomId);
      socket.join(room.roomId);
      io.to(room.roomId).emit('game_state', room);

      const existingToken = existingColor === 'white' ? auth.white : auth.black;
      if (existingToken) {
        socket.emit('player_session', {
          roomId,
          color: existingColor,
          authToken: existingToken,
        });
      }
      return;
    }

    let joinedColor: PlayerColor | null = null;

    if (!room.players.white) {
      if (room.game.status === 'playing' && !(authToken && authToken === auth.white)) {
        socket.emit('game_error', {
          message: 'White seat is reserved for reconnecting player',
        });
        return;
      }
      room.players.white = socket.id;
      joinedColor = 'white';
      if (room.game.status !== 'playing') {
        auth.white = createAuthToken();
      }
    } else if (!room.players.black) {
      if (room.game.status === 'playing' && auth.black) {
        if (!(authToken && authToken === auth.black)) {
          socket.emit('game_error', {
            message: 'Black seat is reserved for reconnecting player',
          });
          return;
        }
        room.players.black = socket.id;
        joinedColor = 'black';
      } else {
        room.players.black = socket.id;
        joinedColor = 'black';
        auth.black = createAuthToken();
      }
    } else {
      socket.emit('game_error', { message: 'Room is full' });
      return;
    }

    if (room.players.white && room.players.black && room.game.status === 'waiting') {
      room.game.status = 'playing';
    }

    cancelDisconnectTimer(roomId);
    socket.join(room.roomId);
    io.to(room.roomId).emit('game_state', room);
    socket.emit('player_session', {
      roomId,
      color: joinedColor,
      authToken: joinedColor === 'white' ? auth.white : auth.black!,
    });
  });

  socket.on('get_game_state', (roomId: string) => {
    const room = getRoom(roomId);

    if (!room) {
      socket.emit('game_error', { message: 'Room not found' });
      return;
    }

    socket.emit('game_state', room);
  });

  socket.on('roll_dice', (roomId: string) => {
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('game_error', { message: 'Room not found' });
      return;
    }

    const playerColor = getPlayerColor(room, socket.id);
    if (!playerColor || playerColor !== room.game.currentTurn) {
      socket.emit('game_error', { message: 'Not your turn' });
      return;
    }

    if (room.game.dice.length > 0 && !allDiceUsed(room.game)) {
      socket.emit('game_error', { message: 'Already rolled' });
      return;
    }

    const dice = rollDice();
    room.game = { ...room.game, dice, usedDice: [] };

    if (!hasAnyValidMoves(room.game)) {
      // Emit with dice shown first so both players can see the blocking roll
      io.to(roomId).emit('game_state', room);
      setTimeout(() => {
        const r = getRoom(roomId);
        if (r) {
          r.game = switchTurn(r.game);
          io.to(roomId).emit('game_state', r);
        }
      }, 2500);
      return;
    }

    io.to(roomId).emit('game_state', room);
  });

  socket.on('move_checker', (roomId: string, move: Move) => {
    const room = getRoom(roomId);
    if (!room) {
      socket.emit('game_error', { message: 'Room not found' });
      return;
    }

    const playerColor = getPlayerColor(room, socket.id);
    if (!playerColor || playerColor !== room.game.currentTurn) {
      socket.emit('game_error', { message: 'Not your turn' });
      return;
    }

    if (
      !move ||
      typeof move !== 'object' ||
      (move.from !== 'bar' && typeof move.from !== 'number') ||
      (move.to !== 'off' && typeof move.to !== 'number') ||
      typeof move.die !== 'number'
    ) {
      socket.emit('game_error', { message: 'Invalid move format' });
      return;
    }

    const validMoves = getValidMoves(room.game, move.from);
    const isValid = validMoves.some(
      (m) => m.from === move.from && m.to === move.to && m.die === move.die,
    );
    if (!isValid) {
      socket.emit('game_error', { message: 'Invalid move' });
      return;
    }

    room.game = applyMove(room.game, move);

    if (room.game.status !== 'finished') {
      if (allDiceUsed(room.game) || !hasAnyValidMoves(room.game)) {
        room.game = switchTurn(room.game);
      }
    } else {
      roomAuthTokens.delete(roomId);
    }

    io.to(roomId).emit('game_state', room);
  });

  socket.on('disconnect', () => {
    const rooms = findRoomsByPlayer(socket.id);
    if (rooms.length === 0) return;

    // Remove the player from the slot immediately so a reconnecting
    // socket (new ID after page reload) can reclaim the slot.
    removePlayer(socket.id);

    for (const room of rooms) {
      const roomId = room.roomId;

      // Delay room cleanup and opponent notification to allow for page reloads.
      cancelDisconnectTimer(roomId);
      const timer = setTimeout(() => {
        disconnectTimers.delete(roomId);
        if (isRoomEmpty(roomId)) {
          deleteRoom(roomId);
          roomAuthTokens.delete(roomId);
        } else {
          // Slot was not reclaimed — notify the remaining player
          io.to(roomId).emit('player_disconnected');
        }
      }, DISCONNECT_GRACE_MS);
      disconnectTimers.set(roomId, timer);
    }
  });
}
