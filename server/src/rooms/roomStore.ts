import { randomUUID } from 'node:crypto';
import { createInitialGameState } from 'shared';
import type { RoomState } from 'shared';

const rooms = new Map<string, RoomState>();

export function clearRooms(): void {
  rooms.clear();
}

export function createRoom(hostSocketId: string): RoomState {
  const roomId = randomUUID().slice(0, 8);

  const room: RoomState = {
    roomId,
    players: {
      white: hostSocketId,
    },
    game: createInitialGameState(),
  };

  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId: string): RoomState | undefined {
  return rooms.get(roomId);
}

export function removePlayer(socketId: string): void {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.white === socketId) {
      delete room.players.white;
    }
    if (room.players.black === socketId) {
      delete room.players.black;
    }
  }
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

export function isRoomEmpty(roomId: string): boolean {
  const room = rooms.get(roomId);
  return !room || (!room.players.white && !room.players.black);
}

export function findRoomsByPlayer(socketId: string): RoomState[] {
  const result: RoomState[] = [];
  for (const room of rooms.values()) {
    if (room.players.white === socketId || room.players.black === socketId) {
      result.push(room);
    }
  }
  return result;
}
