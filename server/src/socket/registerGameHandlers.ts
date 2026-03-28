import type { Server, Socket } from 'socket.io';
import type { GameState, Move, PlayerColor, RoomState } from 'shared';
import { applyMove, getValidMoves, hasAnyValidMoves } from 'shared';
import { createRoom, getRoom, joinRoom, removePlayer, findRoomByPlayer } from '../rooms/roomStore.js';

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

export function registerGameHandlers(io: Server, socket: Socket) {
  socket.on('create_game', () => {
    const room = createRoom(socket.id);
    socket.join(room.roomId);
    socket.emit('game_created', room);
  });

  socket.on('join_game', (roomId: string) => {
    const room = joinRoom(roomId, socket.id);

    if (!room) {
      socket.emit('game_error', { message: 'Room not found' });
      return;
    }

    socket.join(room.roomId);
    io.to(room.roomId).emit('game_state', room);
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
      room.game = switchTurn(room.game);
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
    }

    io.to(roomId).emit('game_state', room);
  });

  socket.on('disconnect', () => {
    const room = findRoomByPlayer(socket.id);
    if (room) {
      const roomId = room.roomId;
      removePlayer(socket.id);
      io.to(roomId).emit('player_disconnected');
    }
  });
}
