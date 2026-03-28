import type { GameState, Move, PlayerColor } from './types.js';
import { applyMove } from './applyMove.js';

function isOpen(game: GameState, pointIndex: number, player: PlayerColor): boolean {
  const point = game.points[pointIndex];
  if (!point) return false;
  if (point.player === null || point.player === player) return true;
  return point.count <= 1;
}

function allCheckersInHome(game: GameState, player: PlayerColor): boolean {
  const [homeStart, homeEnd] = getHomeRange(player);
  if (game.bar[player] > 0) return false;

  for (let i = 0; i < 24; i++) {
    if (i >= homeStart && i <= homeEnd) continue;
    const point = game.points[i];
    if (point && point.player === player && point.count > 0) return false;
  }
  return true;
}

function getHomeRange(player: PlayerColor): [number, number] {
  return player === 'white' ? [18, 23] : [0, 5];
}

function getAvailableDice(game: GameState): number[] {
  const used = [...game.usedDice];
  const available: number[] = [];
  for (const die of game.dice) {
    const idx = used.indexOf(die);
    if (idx !== -1) {
      used.splice(idx, 1);
    } else {
      available.push(die);
    }
  }
  return [...new Set(available)];
}

function getRemainingDice(game: GameState): number[] {
  const used = [...game.usedDice];
  const remaining: number[] = [];
  for (const die of game.dice) {
    const idx = used.indexOf(die);
    if (idx !== -1) {
      used.splice(idx, 1);
    } else {
      remaining.push(die);
    }
  }
  return remaining;
}

function moveKey(move: Move): string {
  return `${move.from}->${move.to}:${move.die}`;
}

function getRawValidMoves(game: GameState, from: number | 'bar'): Move[] {
  const player = game.currentTurn;
  const dir = player === 'white' ? 1 : -1;
  const availableDice = getAvailableDice(game);
  const moves: Move[] = [];

  // Entering from bar
  if (from === 'bar') {
    if (game.bar[player] <= 0) return [];
    for (const die of availableDice) {
      const dest = player === 'white' ? die - 1 : 24 - die;
      if (dest >= 0 && dest <= 23 && isOpen(game, dest, player)) {
        moves.push({ from: 'bar', to: dest, die });
      }
    }
    return moves;
  }

  // Must enter from bar first
  if (game.bar[player] > 0) return [];

  const point = game.points[from];
  if (!point || point.player !== player || point.count <= 0) return [];

  const canBearOff = allCheckersInHome(game, player);
  const [homeStart, homeEnd] = getHomeRange(player);

  for (const die of availableDice) {
    const dest = from + dir * die;

    // Bearing off
    if (canBearOff) {
      if (player === 'white' && dest > 23) {
        if (dest === 24) {
          moves.push({ from, to: 'off', die });
        } else {
          // Over-roll: allowed only if no checker farther from bear-off
          let hasFarther = false;
          for (let i = from - 1; i >= homeStart; i--) {
            if (game.points[i]?.player === player && game.points[i]!.count > 0) {
              hasFarther = true;
              break;
            }
          }
          if (!hasFarther) moves.push({ from, to: 'off', die });
        }
        continue;
      }
      if (player === 'black' && dest < 0) {
        if (dest === -1) {
          moves.push({ from, to: 'off', die });
        } else {
          let hasFarther = false;
          for (let i = from + 1; i <= homeEnd; i++) {
            if (game.points[i]?.player === player && game.points[i]!.count > 0) {
              hasFarther = true;
              break;
            }
          }
          if (!hasFarther) moves.push({ from, to: 'off', die });
        }
        continue;
      }
    }

    // Normal move
    if (dest >= 0 && dest <= 23 && isOpen(game, dest, player)) {
      moves.push({ from, to: dest, die });
    }
  }

  return moves;
}

function getAllRawValidMoves(game: GameState): Move[] {
  const player = game.currentTurn;
  if (game.bar[player] > 0) {
    return getRawValidMoves(game, 'bar');
  }

  const allMoves: Move[] = [];
  for (let i = 0; i < 24; i++) {
    const point = game.points[i];
    if (point && point.player === player && point.count > 0) {
      allMoves.push(...getRawValidMoves(game, i));
    }
  }
  return allMoves;
}

function canPlayDie(game: GameState, die: number): boolean {
  return getAllRawValidMoves(game).some((m) => m.die === die);
}

function filterByTurnDiceRules(game: GameState, moves: Move[]): Move[] {
  const remainingDice = getRemainingDice(game);
  if (remainingDice.length !== 2) return moves;

  const [d1, d2] = remainingDice;
  if (d1 === d2) return moves; // doubles are handled naturally

  const allFirstMoves = getAllRawValidMoves(game);

  // Rule: if both dice can be played, only allow first moves that keep that possibility.
  const firstMovesThatUseBoth = new Set<string>();
  for (const firstMove of allFirstMoves) {
    const secondDie = firstMove.die === d1 ? d2 : d1;
    const nextGame = applyMove(game, firstMove);
    if (canPlayDie(nextGame, secondDie)) {
      firstMovesThatUseBoth.add(moveKey(firstMove));
    }
  }

  if (firstMovesThatUseBoth.size > 0) {
    return moves.filter((m) => firstMovesThatUseBoth.has(moveKey(m)));
  }

  // Rule: if only one die can be played, and both are individually playable, play the higher die.
  const canPlayD1 = allFirstMoves.some((m) => m.die === d1);
  const canPlayD2 = allFirstMoves.some((m) => m.die === d2);
  if (canPlayD1 && canPlayD2) {
    const higherDie = Math.max(d1, d2);
    return moves.filter((m) => m.die === higherDie);
  }

  return moves;
}

export function getValidMoves(game: GameState, from: number | 'bar'): Move[] {
  const rawMoves = getRawValidMoves(game, from);
  return filterByTurnDiceRules(game, rawMoves);
}

export function hasAnyValidMoves(game: GameState): boolean {
  const player = game.currentTurn;
  if (game.bar[player] > 0) {
    return getValidMoves(game, 'bar').length > 0;
  }
  for (let i = 0; i < 24; i++) {
    const point = game.points[i];
    if (point && point.player === player && point.count > 0) {
      if (getValidMoves(game, i).length > 0) return true;
    }
  }
  return false;
}
