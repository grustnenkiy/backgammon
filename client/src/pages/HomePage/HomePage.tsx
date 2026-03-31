import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { socket } from '../../features/game/api/socket';
import type { RoomState } from 'shared';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  function handleCreateOnline() {
    if (isCreating) return;
    setIsCreating(true);

    socket.connect();

    socket.once('game_created', (room: RoomState) => {
      navigate(`/game/${room.roomId}`);
    });

    if (socket.connected) {
      socket.emit('create_game');
    } else {
      socket.once('connect', () => {
        socket.emit('create_game');
      });
    }
  }

  return (
    <div className="home">
      <h1 className="home__title">Backgammon</h1>
      <p className="home__subtitle">A timeless duel of risk, rhythm, and bold moves</p>

      <div className="home__actions">
        <Link to="/game/local" className="home__cta">
          Play Local Game
        </Link>
        <button
          type="button"
          className="home__cta home__cta--online"
          onClick={handleCreateOnline}
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'Play Online'}
        </button>
      </div>
    </div>
  );
}
