import type { GameState, Point } from './types.js';

function createEmptyPoints(): Point[] {
  return Array.from({ length: 24 }, () => ({
    player: null,
    count: 0,
  }));
}

export function createInitialGameState(): GameState {
  const points = createEmptyPoints();

  points[0] = { player: 'white', count: 2 };
  points[11] = { player: 'white', count: 5 };
  points[16] = { player: 'white', count: 3 };
  points[18] = { player: 'white', count: 5 };

  points[23] = { player: 'black', count: 2 };
  points[12] = { player: 'black', count: 5 };
  points[7] = { player: 'black', count: 3 };
  points[5] = { player: 'black', count: 5 };

  return {
    points,
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    currentTurn: 'white',
    dice: [],
    usedDice: [],
    status: 'waiting',
    winner: null,
  };
}
