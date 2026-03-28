export type PlayerColor = 'white' | 'black';

export type Point = {
  player: PlayerColor | null;
  count: number;
};

export type BarState = {
  white: number;
  black: number;
};

export type BorneOffState = {
  white: number;
  black: number;
};

export type GameStatus = 'waiting' | 'playing' | 'finished';

export type GameState = {
  points: Point[];
  bar: BarState;
  borneOff: BorneOffState;
  currentTurn: PlayerColor;
  dice: number[];
  usedDice: number[];
  status: GameStatus;
  winner: PlayerColor | null;
};

export type Move = {
  from: number | 'bar';
  to: number | 'off';
  die: number;
};

export type RoomState = {
  roomId: string;
  players: Partial<Record<PlayerColor, string>>;
  game: GameState;
};
