import { useMemo, useState } from 'react';
import { Board } from '../../../../components/Board';
import { Dice } from '../../../../components/Dice';
import { useLocalGame } from '../../hooks/useLocalGame';
import type { PlayerColor } from 'shared';
import './GameScreen.css';

const DISPLAY_NAME: Record<PlayerColor, string> = {
  white: 'White',
  black: 'Black',
};

export function GameScreen() {
  const [showPointLabels, setShowPointLabels] = useState(false);

  const {
    game,
    selectedSource,
    validDestinations,
    hasRolled,
    handleRollDice,
    handlePointClick,
    handleBarClick,
    handleBearOff,
  } = useLocalGame();

  const title = useMemo(() => {
    if (game.status === 'finished') {
      return `Winner: ${DISPLAY_NAME[game.winner!]}`;
    }
    if (!hasRolled) return `${DISPLAY_NAME[game.currentTurn]} — roll the dice`;
    return `Turn: ${DISPLAY_NAME[game.currentTurn]}`;
  }, [game.currentTurn, game.status, game.winner, hasRolled]);

  return (
    <div className="game-screen">
      <h2 className="game-screen__title">{title}</h2>

      <div className="game-screen__panel">
        <button
          className="game-screen__roll"
          type="button"
          onClick={handleRollDice}
          disabled={hasRolled || game.status === 'finished'}
        >
          Roll Dice
        </button>
        <Dice values={game.dice} usedDice={game.usedDice} />
        <button
          className={`game-screen__toggle${showPointLabels ? ' game-screen__toggle--active' : ''}`}
          type="button"
          onClick={() => setShowPointLabels((prev) => !prev)}
        >
          {showPointLabels ? 'Hide Numbers' : 'Show Numbers'}
        </button>
      </div>

      <div className="game-screen__board-wrap">
        <Board
          game={game}
          showPointLabels={showPointLabels}
          selectedPoint={selectedSource}
          validDestinations={validDestinations}
          onPointClick={handlePointClick}
          onBarClick={handleBarClick}
          onBearOff={handleBearOff}
        />
      </div>
    </div>
  );
}
