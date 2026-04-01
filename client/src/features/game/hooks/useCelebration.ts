import { useEffect, useRef, useState } from 'react';
import type { PlayerColor, GameState } from 'shared';
import { getWinnerTrayCenter } from '../components/WinnerCelebration/getWinnerTrayCenter';

type CelebrationState = {
  winner: PlayerColor;
  key: number;
  origin: { x: number; y: number } | null;
} | null;

export function useCelebration(
  game: GameState | null,
  boardWrapRef: React.RefObject<HTMLDivElement | null>,
) {
  const [celebration, setCelebration] = useState<CelebrationState>(null);
  const hasTriggeredRef = useRef(false);
  const keyRef = useRef(0);

  useEffect(() => {
    if (!game) return;

    if (game.status === 'finished' && game.winner && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      const origin = getWinnerTrayCenter(boardWrapRef.current, game.winner);
      keyRef.current += 1;
      setCelebration({
        winner: game.winner,
        key: keyRef.current,
        origin,
      });
      return;
    }

    if (game.status !== 'finished') {
      hasTriggeredRef.current = false;
      setCelebration(null);
    }
  }, [game?.status, game?.winner, boardWrapRef]);

  const dismiss = () => setCelebration(null);

  return { celebration, dismiss };
}
