import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { socket } from '../../features/game/api/socket';
import type { RoomState } from 'shared';
import { savePlayerSession } from '../../features/game/api/playerSession';
import './HomePage.css';

export function HomePage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function handleCreateOnline() {
    if (isCreating) return;
    setIsCreating(true);
    setCreateError(null);

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      setIsCreating(false);
      setCreateError('Connection timed out. Please try again.');
      cleanup();
    }, 10000);

    function cleanup() {
      socket.off('game_created', onGameCreated);
      socket.off('player_session', onPlayerSession);
      socket.off('game_error', onGameError);
      socket.off('connect_error', onConnectError);
      socket.off('connect', onConnect);
      window.clearTimeout(timeoutId);
    }

    function onPlayerSession(data: { roomId: string; color: 'white' | 'black'; authToken: string }) {
      savePlayerSession(data);
    }

    function onGameCreated(room: RoomState) {
      if (settled) return;
      settled = true;
      setIsCreating(false);
      cleanup();
      navigate(`/game/${room.roomId}`);
    }

    function onGameError() {
      if (settled) return;
      settled = true;
      setIsCreating(false);
      setCreateError('Failed to create game. Please try again.');
      cleanup();
    }

    function onConnectError() {
      if (settled) return;
      settled = true;
      setIsCreating(false);
      setCreateError('Could not connect to server. Please try again.');
      cleanup();
    }

    function onConnect() {
      socket.emit('create_game');
    }

    socket.on('game_created', onGameCreated);
    socket.on('player_session', onPlayerSession);
    socket.on('game_error', onGameError);
    socket.on('connect_error', onConnectError);
    socket.once('connect', onConnect);

    socket.connect();

    if (socket.connected) {
      onConnect();
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
      {createError && <p className="home__error">{createError}</p>}
    </div>
  );
}
