import { describe, it, expect } from 'vitest';
import { createInitialGameState } from '../createInitialGameState.js';

describe('createInitialGameState', () => {
  it('creates 24 points', () => {
    const game = createInitialGameState();
    expect(game.points).toHaveLength(24);
  });

  it('places 15 white checkers in correct positions', () => {
    const game = createInitialGameState();

    expect(game.points[0]).toEqual({ player: 'white', count: 2 });
    expect(game.points[11]).toEqual({ player: 'white', count: 5 });
    expect(game.points[16]).toEqual({ player: 'white', count: 3 });
    expect(game.points[18]).toEqual({ player: 'white', count: 5 });

    const whiteTotal = game.points
      .filter((p) => p.player === 'white')
      .reduce((sum, p) => sum + p.count, 0);
    expect(whiteTotal).toBe(15);
  });

  it('places 15 black checkers in correct positions', () => {
    const game = createInitialGameState();

    expect(game.points[23]).toEqual({ player: 'black', count: 2 });
    expect(game.points[12]).toEqual({ player: 'black', count: 5 });
    expect(game.points[7]).toEqual({ player: 'black', count: 3 });
    expect(game.points[5]).toEqual({ player: 'black', count: 5 });

    const blackTotal = game.points
      .filter((p) => p.player === 'black')
      .reduce((sum, p) => sum + p.count, 0);
    expect(blackTotal).toBe(15);
  });

  it('sets empty points to null player and 0 count', () => {
    const game = createInitialGameState();
    const emptyIndices = [1, 2, 3, 4, 6, 8, 9, 10, 13, 14, 15, 17, 19, 20, 21, 22];

    for (const i of emptyIndices) {
      expect(game.points[i]).toEqual({ player: null, count: 0 });
    }
  });

  it('starts with empty bar', () => {
    const game = createInitialGameState();
    expect(game.bar).toEqual({ white: 0, black: 0 });
  });

  it('starts with no checkers borne off', () => {
    const game = createInitialGameState();
    expect(game.borneOff).toEqual({ white: 0, black: 0 });
  });

  it('starts with white to move', () => {
    const game = createInitialGameState();
    expect(game.currentTurn).toBe('white');
  });

  it('starts with empty dice', () => {
    const game = createInitialGameState();
    expect(game.dice).toEqual([]);
    expect(game.usedDice).toEqual([]);
  });

  it('starts in waiting status with no winner', () => {
    const game = createInitialGameState();
    expect(game.status).toBe('waiting');
    expect(game.winner).toBeNull();
  });

  it('returns a new object on each call', () => {
    const game1 = createInitialGameState();
    const game2 = createInitialGameState();
    expect(game1).not.toBe(game2);
    expect(game1.points).not.toBe(game2.points);
  });
});
