import { describe, it, expect } from 'vitest';
import { getValidMoves, hasAnyValidMoves } from '../getValidMoves.js';
import { createInitialGameState } from '../createInitialGameState.js';
import type { GameState } from '../types.js';

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialGameState(), status: 'playing', ...overrides };
}

function emptyPoints() {
  return Array.from({ length: 24 }, () => ({ player: null as null, count: 0 }));
}

describe('getValidMoves', () => {
  describe('normal moves for white', () => {
    it('returns moves for available dice values', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 2 };
      const game = makeGame({ points, dice: [3, 5], usedDice: [] });
      const moves = getValidMoves(game, 0);

      expect(moves).toContainEqual({ from: 0, to: 3, die: 3 });
      expect(moves).toContainEqual({ from: 0, to: 5, die: 5 });
    });

    it('returns empty when point has no player checkers', () => {
      const game = makeGame({ dice: [3], usedDice: [] });
      const moves = getValidMoves(game, 1); // point 1 is empty
      expect(moves).toEqual([]);
    });

    it('returns empty when point belongs to opponent', () => {
      const game = makeGame({ dice: [3], usedDice: [] });
      const moves = getValidMoves(game, 5); // point 5 = black's
      expect(moves).toEqual([]);
    });

    it('allows landing on opponent blot', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 1 };
      points[3] = { player: 'black', count: 1 };
      const game = makeGame({ points, dice: [3], usedDice: [] });
      const moves = getValidMoves(game, 0);

      expect(moves).toContainEqual({ from: 0, to: 3, die: 3 });
    });

    it('blocks landing on opponent stack (2+)', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 1 };
      points[3] = { player: 'black', count: 2 };
      const game = makeGame({ points, dice: [3], usedDice: [] });
      const moves = getValidMoves(game, 0);

      expect(moves).toEqual([]);
    });

    it('does not allow moves beyond point 23', () => {
      const points = emptyPoints();
      points[22] = { player: 'white', count: 1 };
      // Not in bearing off position (checkers elsewhere)
      points[0] = { player: 'white', count: 1 };
      const game = makeGame({ points, dice: [5], usedDice: [] });
      const moves = getValidMoves(game, 22);

      expect(moves).toEqual([]);
    });
  });

  describe('normal moves for black', () => {
    it('moves in the negative direction', () => {
      const points = emptyPoints();
      points[23] = { player: 'black', count: 2 };
      const game = makeGame({ points, currentTurn: 'black', dice: [3, 5], usedDice: [] });
      const moves = getValidMoves(game, 23);

      expect(moves).toContainEqual({ from: 23, to: 20, die: 3 });
      expect(moves).toContainEqual({ from: 23, to: 18, die: 5 });
    });
  });

  describe('dice tracking', () => {
    it('excludes already used dice', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 2 };
      const game = makeGame({ points, dice: [3, 5], usedDice: [3] });
      const moves = getValidMoves(game, 0);

      expect(moves).not.toContainEqual(expect.objectContaining({ die: 3 }));
      expect(moves).toContainEqual({ from: 0, to: 5, die: 5 });
    });

    it('returns empty when all dice are used', () => {
      const game = makeGame({ dice: [3, 5], usedDice: [3, 5] });
      const moves = getValidMoves(game, 0);

      expect(moves).toEqual([]);
    });

    it('handles doubles (4 dice)', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 4 };
      const game = makeGame({ points, dice: [3, 3, 3, 3], usedDice: [] });
      const moves = getValidMoves(game, 0);

      // Should have one unique move using die value 3
      expect(moves).toEqual([{ from: 0, to: 3, die: 3 }]);
    });

    it('allows multiple uses of doubles', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 4 };
      const game = makeGame({ points, dice: [3, 3, 3, 3], usedDice: [3, 3] });
      // Still 2 unused 3s
      const moves = getValidMoves(game, 0);
      expect(moves).toEqual([{ from: 0, to: 3, die: 3 }]);
    });

    it('returns empty when all doubles are used', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 4 };
      const game = makeGame({ points, dice: [3, 3, 3, 3], usedDice: [3, 3, 3, 3] });
      const moves = getValidMoves(game, 0);
      expect(moves).toEqual([]);
    });
  });

  describe('bar entry', () => {
    it('white enters from bar using die value', () => {
      const points = emptyPoints();
      const game = makeGame({
        points,
        bar: { white: 1, black: 0 },
        dice: [3, 5],
        usedDice: [],
      });
      const moves = getValidMoves(game, 'bar');

      // white enters at die-1: 3→point 2, 5→point 4
      expect(moves).toContainEqual({ from: 'bar', to: 2, die: 3 });
      expect(moves).toContainEqual({ from: 'bar', to: 4, die: 5 });
    });

    it('black enters from bar using die value', () => {
      const points = emptyPoints();
      const game = makeGame({
        points,
        currentTurn: 'black',
        bar: { white: 0, black: 1 },
        dice: [3, 5],
        usedDice: [],
      });
      const moves = getValidMoves(game, 'bar');

      // black enters at 24-die: 3→point 21, 5→point 19
      expect(moves).toContainEqual({ from: 'bar', to: 21, die: 3 });
      expect(moves).toContainEqual({ from: 'bar', to: 19, die: 5 });
    });

    it('blocks entry on opponent-occupied points (2+)', () => {
      const points = emptyPoints();
      points[2] = { player: 'black', count: 2 }; // blocks white die=3
      const game = makeGame({
        points,
        bar: { white: 1, black: 0 },
        dice: [3, 5],
        usedDice: [],
      });
      const moves = getValidMoves(game, 'bar');

      expect(moves).not.toContainEqual(expect.objectContaining({ to: 2 }));
      expect(moves).toContainEqual({ from: 'bar', to: 4, die: 5 });
    });

    it('returns empty when no entry points are open', () => {
      const points = emptyPoints();
      // Block all entry points for white (0-5)
      for (let i = 0; i < 6; i++) {
        points[i] = { player: 'black', count: 2 };
      }
      const game = makeGame({
        points,
        bar: { white: 1, black: 0 },
        dice: [1, 2],
        usedDice: [],
      });
      const moves = getValidMoves(game, 'bar');
      expect(moves).toEqual([]);
    });

    it('forces bar entry before any other move', () => {
      const game = makeGame({
        bar: { white: 1, black: 0 },
        dice: [3, 5],
        usedDice: [],
      });
      // Point 0 has white checkers in initial setup
      const moves = getValidMoves(game, 0);
      expect(moves).toEqual([]);
    });

    it('returns empty when player has no checkers on bar', () => {
      const game = makeGame({
        bar: { white: 0, black: 0 },
        dice: [3],
        usedDice: [],
      });
      const moves = getValidMoves(game, 'bar');
      expect(moves).toEqual([]);
    });
  });

  describe('bearing off — white', () => {
    it('allows exact bear-off with matching die', () => {
      const points = emptyPoints();
      points[23] = { player: 'white', count: 2 }; // point 23, die 1 → off
      const game = makeGame({ points, dice: [1], usedDice: [] });
      const moves = getValidMoves(game, 23);

      expect(moves).toContainEqual({ from: 23, to: 'off', die: 1 });
    });

    it('allows bearing off from point 22 with die 2', () => {
      const points = emptyPoints();
      points[22] = { player: 'white', count: 1 };
      const game = makeGame({ points, dice: [2], usedDice: [] });
      const moves = getValidMoves(game, 22);

      expect(moves).toContainEqual({ from: 22, to: 'off', die: 2 });
    });

    it('allows over-roll when no checker is farther back', () => {
      const points = emptyPoints();
      points[22] = { player: 'white', count: 1 }; // point 22 with die 6 → dest 28 > 23
      const game = makeGame({ points, dice: [6], usedDice: [] });
      const moves = getValidMoves(game, 22);

      // No checker farther back than 22 in home, so over-roll allowed
      expect(moves).toContainEqual({ from: 22, to: 'off', die: 6 });
    });

    it('blocks over-roll when there is a checker farther back', () => {
      const points = emptyPoints();
      points[18] = { player: 'white', count: 1 }; // farther from bear-off
      points[22] = { player: 'white', count: 1 };
      const game = makeGame({ points, dice: [6], usedDice: [] });
      const moves = getValidMoves(game, 22);

      // Checker at 18 is farther back, so over-roll from 22 is blocked
      expect(moves).not.toContainEqual(expect.objectContaining({ to: 'off' }));
    });

    it('does not allow bearing off when checkers are outside home', () => {
      const points = emptyPoints();
      points[10] = { player: 'white', count: 1 }; // outside home range [18,23]
      points[23] = { player: 'white', count: 1 };
      const game = makeGame({ points, dice: [1], usedDice: [] });
      const moves = getValidMoves(game, 23);

      expect(moves).not.toContainEqual(expect.objectContaining({ to: 'off' }));
    });

    it('does not allow bearing off when checker is on bar', () => {
      const points = emptyPoints();
      points[23] = { player: 'white', count: 1 };
      const game = makeGame({
        points,
        bar: { white: 1, black: 0 },
        dice: [1],
        usedDice: [],
      });
      // Can't bear off from 23 because checker on bar
      const moves = getValidMoves(game, 23);
      expect(moves).toEqual([]);
    });
  });

  describe('bearing off — black', () => {
    it('allows exact bear-off with matching die', () => {
      const points = emptyPoints();
      points[0] = { player: 'black', count: 2 }; // point 0, die 1 → dest -1 → off
      const game = makeGame({ points, currentTurn: 'black', dice: [1], usedDice: [] });
      const moves = getValidMoves(game, 0);

      expect(moves).toContainEqual({ from: 0, to: 'off', die: 1 });
    });

    it('allows over-roll when no checker is farther back', () => {
      const points = emptyPoints();
      points[1] = { player: 'black', count: 1 }; // point 1, die 6 → dest -5 < -1
      const game = makeGame({ points, currentTurn: 'black', dice: [6], usedDice: [] });
      const moves = getValidMoves(game, 1);

      expect(moves).toContainEqual({ from: 1, to: 'off', die: 6 });
    });

    it('blocks over-roll when there is a checker farther back', () => {
      const points = emptyPoints();
      points[1] = { player: 'black', count: 1 };
      points[5] = { player: 'black', count: 1 }; // farther from bear-off (for black, higher index)
      const game = makeGame({ points, currentTurn: 'black', dice: [6], usedDice: [] });
      const moves = getValidMoves(game, 1);

      // Checker at 5 is farther from black's bear-off, so over-roll blocked
      expect(moves).not.toContainEqual(expect.objectContaining({ to: 'off' }));
    });
  });

  describe('turn dice usage rules', () => {
    it('forces playing both dice when possible (filters first move choices)', () => {
      const points = emptyPoints();
      points[22] = { player: 'white', count: 1 };
      const game = makeGame({ points, dice: [1, 2], usedDice: [] });

      const moves = getValidMoves(game, 22);

      // Die 2 can bear off immediately, but that would prevent using die 1.
      // Since using both dice is possible (1 to point 23, then 2 to off),
      // only the first move with die 1 is legal.
      expect(moves).toContainEqual({ from: 22, to: 23, die: 1 });
      expect(moves).not.toContainEqual({ from: 22, to: 'off', die: 2 });
    });

    it('forces higher die when both dice are playable but both cannot be used', () => {
      const points = emptyPoints();
      points[2] = { player: 'black', count: 2 };
      const game = makeGame({
        points,
        bar: { white: 1, black: 0 },
        dice: [1, 2],
        usedDice: [],
      });

      // Either die can enter from bar, but whichever is used first,
      // the remaining die has no legal move due point 2 being blocked.
      const moves = getValidMoves(game, 'bar');
      expect(moves).toEqual([{ from: 'bar', to: 1, die: 2 }]);
    });
  });

  describe('combined scenarios', () => {
    it('allows both normal moves and bearing off when in home', () => {
      const points = emptyPoints();
      points[20] = { player: 'white', count: 2 };
      const game = makeGame({ points, dice: [3, 4], usedDice: [] });
      const moves = getValidMoves(game, 20);

      // die 4: 20+4=24 → exact bear-off
      expect(moves).toContainEqual({ from: 20, to: 'off', die: 4 });
      // die 3: 20+3=23 → normal move
      expect(moves).toContainEqual({ from: 20, to: 23, die: 3 });
    });
  });
});

describe('hasAnyValidMoves', () => {
  it('returns true at the start of a game with dice', () => {
    const game = makeGame({ dice: [3, 5], usedDice: [] });
    expect(hasAnyValidMoves(game)).toBe(true);
  });

  it('returns false when all dice are used', () => {
    const game = makeGame({ dice: [3, 5], usedDice: [3, 5] });
    expect(hasAnyValidMoves(game)).toBe(false);
  });

  it('returns false when completely blocked', () => {
    const points = emptyPoints();
    points[0] = { player: 'white', count: 1 };
    // Block all destinations
    points[1] = { player: 'black', count: 2 };
    points[2] = { player: 'black', count: 2 };
    points[3] = { player: 'black', count: 2 };
    points[4] = { player: 'black', count: 2 };
    points[5] = { player: 'black', count: 2 };
    points[6] = { player: 'black', count: 2 };
    const game = makeGame({ points, dice: [1, 2, 3, 4, 5, 6], usedDice: [] });
    expect(hasAnyValidMoves(game)).toBe(false);
  });

  it('checks bar first when player has checkers on bar', () => {
    const points = emptyPoints();
    // Block all bar entry points for white
    for (let i = 0; i < 6; i++) {
      points[i] = { player: 'black', count: 2 };
    }
    points[10] = { player: 'white', count: 5 }; // has free checkers but bar blocks
    const game = makeGame({
      points,
      bar: { white: 1, black: 0 },
      dice: [1, 2],
      usedDice: [],
    });
    expect(hasAnyValidMoves(game)).toBe(false);
  });

  it('returns true when bar entry is possible', () => {
    const points = emptyPoints();
    points[2] = { player: null, count: 0 }; // open for die=3
    const game = makeGame({
      points,
      bar: { white: 1, black: 0 },
      dice: [3],
      usedDice: [],
    });
    expect(hasAnyValidMoves(game)).toBe(true);
  });

  it('returns true when bearing off is possible', () => {
    const points = emptyPoints();
    points[23] = { player: 'white', count: 1 };
    const game = makeGame({ points, dice: [1], usedDice: [] });
    expect(hasAnyValidMoves(game)).toBe(true);
  });
});
