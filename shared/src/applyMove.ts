import type { GameState, Move, PlayerColor } from './types.js';

export function applyMove(game: GameState, move: Move): GameState {
  const newPoints = game.points.map((p) => ({ ...p }));
  const newBar = { ...game.bar };
  const newBorneOff = { ...game.borneOff };
  const player = game.currentTurn;
  const opponent: PlayerColor = player === 'white' ? 'black' : 'white';

  // Remove from source
  if (move.from === 'bar') {
    newBar[player]--;
  } else {
    const source = newPoints[move.from]!;
    source.count--;
    if (source.count === 0) source.player = null;
  }

  // Place at destination
  if (move.to === 'off') {
    newBorneOff[player]++;
  } else {
    const dest = newPoints[move.to]!;
    // Hit opponent's blot
    if (dest.player === opponent && dest.count === 1) {
      dest.count = 0;
      dest.player = null;
      newBar[opponent]++;
    }
    dest.player = player;
    dest.count++;
  }

  const newUsedDice = [...game.usedDice, move.die];

  const newGame: GameState = {
    ...game,
    points: newPoints,
    bar: newBar,
    borneOff: newBorneOff,
    usedDice: newUsedDice,
  };

  if (newBorneOff[player] === 15) {
    newGame.status = 'finished';
    newGame.winner = player;
  }

  return newGame;
}
