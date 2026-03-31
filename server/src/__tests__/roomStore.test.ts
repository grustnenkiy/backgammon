import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRoom,
  getRoom,
  joinRoom,
  removePlayer,
  deleteEmptyRooms,
  findRoomByPlayer,
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

describe('joinRoom', () => {
  it('assigns the joiner as black', () => {
    const room = createRoom('host');
    const joined = joinRoom(room.roomId, 'guest');

    expect(joined).not.toBeNull();
    expect(joined!.players.black).toBe('guest');
  });

  it('sets game status to playing', () => {
    const room = createRoom('host');
    const joined = joinRoom(room.roomId, 'guest');

    expect(joined!.game.status).toBe('playing');
  });

  it('returns null for non-existent room', () => {
    expect(joinRoom('nonexistent', 'guest')).toBeNull();
  });

  it('does not overwrite black if already assigned', () => {
    const room = createRoom('host');
    joinRoom(room.roomId, 'guest-1');
    const result = joinRoom(room.roomId, 'guest-2');

    expect(result).toBeNull();
    expect(room.players.black).toBe('guest-1');
  });

  it('allows the host to rejoin their own room', () => {
    const room = createRoom('host');
    const result = joinRoom(room.roomId, 'host');

    expect(result).toBe(room);
    expect(result!.game.status).toBe('waiting');
  });

  it('returns the same room reference', () => {
    const room = createRoom('host');
    const joined = joinRoom(room.roomId, 'guest');

    expect(joined).toBe(room);
  });
});

describe('removePlayer', () => {
  it('removes white player from room', () => {
    const room = createRoom('host');
    joinRoom(room.roomId, 'guest');

    removePlayer('host');

    expect(room.players.white).toBeUndefined();
    expect(room.players.black).toBe('guest');
  });

  it('removes black player from room', () => {
    const room = createRoom('host');
    joinRoom(room.roomId, 'guest');

    removePlayer('guest');

    expect(room.players.white).toBe('host');
    expect(room.players.black).toBeUndefined();
  });

  it('does not delete room when both players are gone', () => {
    const room = createRoom('host');
    joinRoom(room.roomId, 'guest');

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

describe('deleteEmptyRooms', () => {
  it('deletes rooms with no players', () => {
    const room = createRoom('host');
    removePlayer('host');
    deleteEmptyRooms();

    expect(getRoom(room.roomId)).toBeUndefined();
  });

  it('keeps rooms that still have players', () => {
    const room = createRoom('host');
    joinRoom(room.roomId, 'guest');
    removePlayer('guest');
    deleteEmptyRooms();

    expect(getRoom(room.roomId)).toBeDefined();
  });
});

describe('findRoomByPlayer', () => {
  it('finds room where player is white', () => {
    const room = createRoom('host');
    expect(findRoomByPlayer('host')).toBe(room);
  });

  it('finds room where player is black', () => {
    const room = createRoom('host');
    joinRoom(room.roomId, 'guest');

    expect(findRoomByPlayer('guest')).toBe(room);
  });

  it('returns undefined for unknown socket', () => {
    createRoom('host');
    expect(findRoomByPlayer('unknown')).toBeUndefined();
  });
});
