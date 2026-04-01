import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRoom,
  getRoom,
  removePlayer,
  deleteRoom,
  isRoomEmpty,
  findRoomsByPlayer,
  clearRooms,
} from '../rooms/roomStore.js';

beforeEach(() => {
  clearRooms();
});

describe('createRoom', () => {
  it('creates a room with the host as white', () => {
    const room = createRoom('host-socket');

    expect(room.roomId).toBeTypeOf('string');
    expect(room.roomId.length).toBe(8);
    expect(room.players.white).toBe('host-socket');
    expect(room.players.black).toBeUndefined();
  });

  it('initializes game in waiting status', () => {
    const room = createRoom('host-socket');

    expect(room.game.status).toBe('waiting');
    expect(room.game.points).toHaveLength(24);
  });

  it('stores the room so it can be retrieved', () => {
    const room = createRoom('host-socket');
    const retrieved = getRoom(room.roomId);

    expect(retrieved).toBe(room);
  });

  it('creates unique room IDs', () => {
    const room1 = createRoom('socket-1');
    const room2 = createRoom('socket-2');

    expect(room1.roomId).not.toBe(room2.roomId);
  });
});

describe('getRoom', () => {
  it('returns undefined for non-existent room', () => {
    expect(getRoom('nonexistent')).toBeUndefined();
  });

  it('returns the room when it exists', () => {
    const room = createRoom('host');
    expect(getRoom(room.roomId)).toBe(room);
  });
});

describe('removePlayer', () => {
  it('removes white player from room', () => {
    const room = createRoom('host');
    room.players.black = 'guest';

    removePlayer('host');

    expect(room.players.white).toBeUndefined();
    expect(room.players.black).toBe('guest');
  });

  it('removes black player from room', () => {
    const room = createRoom('host');
    room.players.black = 'guest';

    removePlayer('guest');

    expect(room.players.white).toBe('host');
    expect(room.players.black).toBeUndefined();
  });

  it('does not delete room when both players are gone', () => {
    const room = createRoom('host');
    room.players.black = 'guest';

    removePlayer('host');
    removePlayer('guest');

    expect(getRoom(room.roomId)).toBeDefined();
  });

  it('does not delete room when sole player leaves', () => {
    const room = createRoom('host');
    removePlayer('host');

    expect(getRoom(room.roomId)).toBeDefined();
  });

  it('is a no-op for unknown socket ID', () => {
    const room = createRoom('host');
    removePlayer('unknown');

    expect(getRoom(room.roomId)).toBeDefined();
    expect(room.players.white).toBe('host');
  });
});

describe('deleteRoom', () => {
  it('deletes the specified room', () => {
    const room = createRoom('host');
    deleteRoom(room.roomId);

    expect(getRoom(room.roomId)).toBeUndefined();
  });

  it('is a no-op for non-existent room', () => {
    deleteRoom('nonexistent');
    // no error thrown
  });
});

describe('isRoomEmpty', () => {
  it('returns true when room has no players', () => {
    const room = createRoom('host');
    removePlayer('host');

    expect(isRoomEmpty(room.roomId)).toBe(true);
  });

  it('returns false when room has a player', () => {
    const room = createRoom('host');

    expect(isRoomEmpty(room.roomId)).toBe(false);
  });

  it('returns true for non-existent room', () => {
    expect(isRoomEmpty('nonexistent')).toBe(true);
  });
});

describe('findRoomsByPlayer', () => {
  it('finds room where player is white', () => {
    const room = createRoom('host');
    expect(findRoomsByPlayer('host')).toEqual([room]);
  });

  it('finds room where player is black', () => {
    const room = createRoom('host');
    room.players.black = 'guest';

    expect(findRoomsByPlayer('guest')).toEqual([room]);
  });

  it('returns empty array for unknown socket', () => {
    createRoom('host');
    expect(findRoomsByPlayer('unknown')).toEqual([]);
  });

  it('finds multiple rooms for the same player', () => {
    const room1 = createRoom('host');
    const room2 = createRoom('host');

    expect(findRoomsByPlayer('host')).toEqual([room1, room2]);
  });
});
