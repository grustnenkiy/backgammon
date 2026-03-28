import { useParams } from 'react-router-dom';
import { GameScreen, OnlineGameScreen } from '../../features/game';

export function GamePage() {
  const { roomId } = useParams<{ roomId: string }>();

  if (roomId === 'local') {
    return <GameScreen />;
  }

  return <OnlineGameScreen roomId={roomId!} />;
}
