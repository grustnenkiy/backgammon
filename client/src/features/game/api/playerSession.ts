import type { PlayerColor } from 'shared';

const STORAGE_KEY = 'backgammon:online-sessions';

type SessionRecord = {
  roomId: string;
  color: PlayerColor;
  authToken: string;
};

type SessionMap = Record<string, SessionRecord>;

function isPlayerColor(value: unknown): value is PlayerColor {
  return value === 'white' || value === 'black';
}

function isSessionRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<SessionRecord>;
  return (
    typeof record.roomId === 'string' &&
    isPlayerColor(record.color) &&
    typeof record.authToken === 'string'
  );
}

function readSessionMap(): SessionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};

    const map: SessionMap = {};
    for (const value of Object.values(parsed)) {
      if (!isSessionRecord(value)) continue;
      map[value.roomId] = value;
    }
    return map;
  } catch {
    return {};
  }
}

function writeSessionMap(value: SessionMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

const MAX_SESSIONS = 20;

export function savePlayerSession(session: SessionRecord): void {
  const map = readSessionMap();
  map[session.roomId] = session;

  const keys = Object.keys(map);
  if (keys.length > MAX_SESSIONS) {
    for (const key of keys.slice(0, keys.length - MAX_SESSIONS)) {
      delete map[key];
    }
  }

  writeSessionMap(map);
}

export function getPlayerSession(roomId: string): SessionRecord | null {
  const map = readSessionMap();
  return map[roomId] ?? null;
}
