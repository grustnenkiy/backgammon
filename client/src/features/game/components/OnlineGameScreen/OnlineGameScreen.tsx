import { useMemo } from 'react';
import { Board } from '../../../../components/Board';
import { Dice } from '../../../../components/Dice';
import { useOnlineGame } from '../../hooks/useOnlineGame';
import type { PlayerColor } from 'shared';
import '../GameScreen/GameScreen.css';

const DISPLAY_NAME: Record<PlayerColor, string> = {
  white: 'White',
  black: 'Black',
};

type OnlineGameScreenProps = {
  roomId: string;
};

export function OnlineGameScreen({ roomId }: OnlineGameScreenProps) {
  const {
    game,
    myColor,
    status,
    error,
    isMyTurn,
    selectedSource,
    validDestinations,
    hasRolled,
    noMovesNotice,
    handleRollDice,
    handlePointClick,
    handleBarClick,
    handleBearOff,
  } = useOnlineGame(roomId);

  if (status === 'connecting') {
    return (
      <div className="game-screen">
        <h2 className="game-screen__title">Connecting...</h2>
      </div>
    );
  }

  if (status === 'error' || error) {
    return (
      <div className="game-screen">
        <h2 className="game-screen__title">Error: {error ?? 'Unknown error'}</h2>
      </div>
    );
  }

  if (status === 'waiting') {
    return (
      <div className="game-screen">
        <h2 className="game-screen__title">Waiting for opponent...</h2>
        <p className="game-screen__info">Share this link with a friend to start playing</p>
        <div className="game-screen__link-box">
          <input
            className="game-screen__link-input"
            readOnly
            value={window.location.href}
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            className="game-screen__roll"
            type="button"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            Copy
          </button>
        </div>
      </div>
    );
  }

  if (status === 'disconnected') {
    return (
      <div className="game-screen">
        <h2 className="game-screen__title">Opponent disconnected</h2>
      </div>
    );
  }

  if (!game || !myColor) return null;

  const title = useMemo(() => {
    if (game.status === 'finished') {
      const winnerName = DISPLAY_NAME[game.winner!];
      return game.winner === myColor ? `${winnerName} (You) wins!` : `${winnerName} wins`;
    }
    const turnName = DISPLAY_NAME[game.currentTurn];
    if (isMyTurn) {
      if (!hasRolled && game.dice.length === 0) return `${turnName} (You) — roll the dice`;
      return `Your turn (${turnName})`;
    }
    return `${turnName}'s turn — waiting...`;
  }, [game.currentTurn, game.status, game.winner, game.dice.length, myColor, isMyTurn, hasRolled]);

  return (
    <div className="game-screen">
      <h2 className="game-screen__title">{title}</h2>

      {noMovesNotice && <p className="game-screen__notice">No valid moves — turn passes</p>}

      <div className="game-screen__panel">
        <button
          className="game-screen__roll"
          type="button"
          onClick={handleRollDice}
          disabled={!isMyTurn || game.dice.length > 0 || game.status === 'finished'}
        >
          Roll Dice
        </button>
        <Dice values={game.dice} usedDice={game.usedDice} />
      </div>

      <div className="game-screen__board-wrap">
        <Board
          game={game}
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
