import { describe, it, expect } from 'vitest';
import { applyMove } from '../applyMove.js';
import { createInitialGameState } from '../createInitialGameState.js';
import type { GameState, Move } from '../types.js';

function makeGame(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialGameState(), status: 'playing', ...overrides };
}

function emptyPoints() {
  return Array.from({ length: 24 }, () => ({ player: null as null, count: 0 }));
}

describe('applyMove', () => {
  describe('normal moves', () => {
    it('moves a checker from one point to another', () => {
      const game = makeGame({ dice: [3, 5], usedDice: [] });
      const move: Move = { from: 0, to: 3, die: 3 };
      const result = applyMove(game, move);

      expect(result.points[0]).toEqual({ player: 'white', count: 1 });
      expect(result.points[3]).toEqual({ player: 'white', count: 1 });
    });

    it('clears point player when last checker leaves', () => {
      const points = emptyPoints();
      points[10] = { player: 'white', count: 1 };
      const game = makeGame({ points, dice: [2], usedDice: [] });
      const result = applyMove(game, { from: 10, to: 12, die: 2 });

      expect(result.points[10]).toEqual({ player: null, count: 0 });
      expect(result.points[12]).toEqual({ player: 'white', count: 1 });
    });

    it('tracks used dice', () => {
      const game = makeGame({ dice: [3, 5], usedDice: [] });
      const result = applyMove(game, { from: 0, to: 3, die: 3 });

      expect(result.usedDice).toEqual([3]);
    });

    it('appends to existing used dice', () => {
      const game = makeGame({ dice: [3, 5], usedDice: [3] });
      const result = applyMove(game, { from: 0, to: 5, die: 5 });

      expect(result.usedDice).toEqual([3, 5]);
    });
  });

  describe('hitting blots', () => {
    it('sends opponent checker to bar when hitting a blot', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 1 };
      points[3] = { player: 'black', count: 1 };
      const game = makeGame({ points, dice: [3], usedDice: [] });

      const result = applyMove(game, { from: 0, to: 3, die: 3 });

      expect(result.points[3]).toEqual({ player: 'white', count: 1 });
      expect(result.bar.black).toBe(1);
    });

    it('does not hit when opponent has 2+ checkers', () => {
      const points = emptyPoints();
      points[0] = { player: 'white', count: 1 };
      points[3] = { player: 'black', count: 2 };
      // This would be an invalid move in practice, but applyMove doesn't validate
      const game = makeGame({ points, dice: [3], usedDice: [] });
      const result = applyMove(game, { from: 0, to: 3, die: 3 });

      // Checker is added on top (no hit)
      expect(result.points[3]).toEqual({ player: 'white', count: 3 });
      expect(result.bar.black).toBe(0);
    });
  });

  describe('bar moves', () => {
    it('removes checker from bar when entering', () => {
      const points = emptyPoints();
      const game = makeGame({
        points,
        bar: { white: 2, black: 0 },
        dice: [3],
        usedDice: [],
      });
      const result = applyMove(game, { from: 'bar', to: 2, die: 3 });

      expect(result.bar.white).toBe(1);
      expect(result.points[2]).toEqual({ player: 'white', count: 1 });
    });
  });

  describe('bearing off', () => {
    it('increments borne off count', () => {
      const points = emptyPoints();
      points[23] = { player: 'white', count: 1 };
      const game = makeGame({ points, dice: [1], usedDice: [] });
      const result = applyMove(game, { from: 23, to: 'off', die: 1 });

      expect(result.borneOff.white).toBe(1);
      expect(result.points[23]).toEqual({ player: null, count: 0 });
    });

    it('detects win when 15th checker is borne off', () => {
      const points = emptyPoints();
      points[23] = { player: 'white', count: 1 };
      const game = makeGame({
        points,
        borneOff: { white: 14, black: 0 },
        dice: [1],
        usedDice: [],
      });
      const result = applyMove(game, { from: 23, to: 'off', die: 1 });

      expect(result.borneOff.white).toBe(15);
      expect(result.status).toBe('finished');
      expect(result.winner).toBe('white');
    });

    it('does not set winner when not all checkers borne off', () => {
      const points = emptyPoints();
      points[23] = { player: 'white', count: 2 };
      const game = makeGame({
        points,
        borneOff: { white: 13, black: 0 },
        dice: [1],
        usedDice: [],
      });
      const result = applyMove(game, { from: 23, to: 'off', die: 1 });

      expect(result.borneOff.white).toBe(14);
      expect(result.status).toBe('playing');
      expect(result.winner).toBeNull();
    });

    it('works for black bearing off', () => {
      const points = emptyPoints();
      points[0] = { player: 'black', count: 1 };
      const game = makeGame({
        points,
        currentTurn: 'black',
        borneOff: { white: 0, black: 14 },
        dice: [1],
        usedDice: [],
      });
      const result = applyMove(game, { from: 0, to: 'off', die: 1 });

      expect(result.borneOff.black).toBe(15);
      expect(result.status).toBe('finished');
      expect(result.winner).toBe('black');
    });
  });

  describe('immutability', () => {
    it('does not mutate the original game state', () => {
      const game = makeGame({ dice: [3, 5], usedDice: [] });
      const originalPoints0 = { ...game.points[0]! };
      const originalBar = { ...game.bar };

      applyMove(game, { from: 0, to: 3, die: 3 });

      expect(game.points[0]).toEqual(originalPoints0);
      expect(game.bar).toEqual(originalBar);
      expect(game.usedDice).toEqual([]);
    });

    it('returns a new game state object', () => {
      const game = makeGame({ dice: [3], usedDice: [] });
      const result = applyMove(game, { from: 0, to: 3, die: 3 });

      expect(result).not.toBe(game);
      expect(result.points).not.toBe(game.points);
      expect(result.bar).not.toBe(game.bar);
      expect(result.borneOff).not.toBe(game.borneOff);
    });
  });
});
