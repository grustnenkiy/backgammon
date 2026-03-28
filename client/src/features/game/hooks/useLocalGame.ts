import { useMemo, useState } from 'react';
import type { GameState, Move } from 'shared';
import { createInitialGameState, getValidMoves, hasAnyValidMoves, applyMove } from 'shared';

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

export function useLocalGame() {
  const [game, setGame] = useState<GameState>(() => ({
    ...createInitialGameState(),
    status: 'playing',
  }));
  const [selectedSource, setSelectedSource] = useState<number | 'bar' | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [hasRolled, setHasRolled] = useState(false);

  const validDestinations = useMemo(() => validMoves.map((m) => m.to), [validMoves]);

  function afterMove(newGame: GameState) {
    if (newGame.status === 'finished') {
      setGame(newGame);
      setHasRolled(false);
      setSelectedSource(null);
      setValidMoves([]);
      return;
    }

    if (allDiceUsed(newGame) || !hasAnyValidMoves(newGame)) {
      setGame(switchTurn(newGame));
      setHasRolled(false);
      setSelectedSource(null);
      setValidMoves([]);
      return;
    }

    // Auto-select bar if the player still has checkers there
    if (newGame.bar[newGame.currentTurn] > 0) {
      const barMoves = getValidMoves(newGame, 'bar');
      setGame(newGame);
      setSelectedSource('bar');
      setValidMoves(barMoves);
    } else {
      setGame(newGame);
      setSelectedSource(null);
      setValidMoves([]);
    }
  }

  function handleRollDice() {
    if (hasRolled || game.status === 'finished') return;

    const newDice = rollDice();
    const newGame: GameState = { ...game, dice: newDice, usedDice: [] };

    if (!hasAnyValidMoves(newGame)) {
      // No valid moves at all — skip turn
      setGame(switchTurn(newGame));
      return;
    }

    setHasRolled(true);

    // Auto-select bar if needed
    if (newGame.bar[newGame.currentTurn] > 0) {
      const barMoves = getValidMoves(newGame, 'bar');
      setGame(newGame);
      setSelectedSource('bar');
      setValidMoves(barMoves);
    } else {
      setGame(newGame);
    }
  }

  function handlePointClick(pointIndex: number) {
    if (!hasRolled || game.status !== 'playing') return;

    // Clicking the already-selected point → deselect
    if (selectedSource === pointIndex) {
      setSelectedSource(null);
      setValidMoves([]);
      return;
    }

    // Clicking a valid destination → execute move
    if (selectedSource !== null) {
      const move = validMoves.find((m) => m.to === pointIndex);
      if (move) {
        afterMove(applyMove(game, move));
        return;
      }
    }

    // Can't select board points when must enter from bar
    if (game.bar[game.currentTurn] > 0) return;

    // Select new source point
    const point = game.points[pointIndex];
    if (point && point.player === game.currentTurn && point.count > 0) {
      const moves = getValidMoves(game, pointIndex);
      if (moves.length > 0) {
        setSelectedSource(pointIndex);
        setValidMoves(moves);
        return;
      }
    }

    // Click elsewhere → deselect
    setSelectedSource(null);
    setValidMoves([]);
  }

  function handleBarClick() {
    if (!hasRolled || game.status !== 'playing') return;
    if (game.bar[game.currentTurn] <= 0) return;

    const moves = getValidMoves(game, 'bar');
    if (moves.length > 0) {
      setSelectedSource('bar');
      setValidMoves(moves);
    }
  }

  function handleBearOff() {
    if (selectedSource === null) return;
    const move = validMoves.find((m) => m.to === 'off');
    if (move) {
      afterMove(applyMove(game, move));
    }
  }

  return {
    game,
    selectedSource,
    validDestinations,
    hasRolled,
    handleRollDice,
    handlePointClick,
    handleBarClick,
    handleBearOff,
  };
}
