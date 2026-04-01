import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Move, PlayerColor, RoomState } from 'shared';
import { getValidMoves, hasAnyValidMoves } from 'shared';
import { socket } from '../api/socket';

type OnlineStatus = 'connecting' | 'waiting' | 'playing' | 'finished' | 'disconnected' | 'error';

export function useOnlineGame(roomId: string) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myColor, setMyColor] = useState<PlayerColor | null>(null);
  const [status, setStatus] = useState<OnlineStatus>('connecting');
  const [error, setError] = useState<string | null>(null);

  const [selectedSource, setSelectedSource] = useState<number | 'bar' | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const [noMovesNotice, setNoMovesNotice] = useState(false);

  const game = room?.game ?? null;

  const isMyTurn = game !== null && myColor !== null && game.currentTurn === myColor;
  const hasRolled =
    game !== null && game.dice.length > 0 && game.usedDice.length < game.dice.length;

  const validDestinations = useMemo(() => validMoves.map((m) => m.to), [validMoves]);

  // Determine my color from the room's player map
  const resolveMyColor = useCallback((r: RoomState) => {
    if (r.players.white === socket.id) return 'white' as PlayerColor;
    if (r.players.black === socket.id) return 'black' as PlayerColor;
    return null;
  }, []);

  // Clear selection state when game state changes (server is authoritative)
  const clearSelection = useCallback(() => {
    setSelectedSource(null);
    setValidMoves([]);
  }, []);

  useEffect(() => {
    let disconnectTimer: ReturnType<typeof setTimeout> | undefined;

    function onConnect() {
      socket.emit('join_game', roomId);
    }

    function onGameCreated(r: RoomState) {
      setRoom(r);
      setMyColor(resolveMyColor(r));
      setStatus('waiting');
    }

    function onGameState(r: RoomState) {
      setRoom(r);
      const color = resolveMyColor(r);
      if (color) setMyColor(color);

      if (r.game.status === 'finished') {
        setStatus('finished');
      } else if (r.game.status === 'playing') {
        setStatus('playing');
      } else {
        setStatus('waiting');
      }

      // Show notice when dice are visible but no moves are possible
      setNoMovesNotice(r.game.dice.length > 0 && !hasAnyValidMoves(r.game));
      clearSelection();
    }

    function onPlayerDisconnected() {
      setStatus('disconnected');
    }

    function onGameError(data: { message: string }) {
      setError(data.message);
      setStatus('error');
    }

    socket.on('connect', onConnect);
    socket.on('game_created', onGameCreated);
    socket.on('game_state', onGameState);
    socket.on('player_disconnected', onPlayerDisconnected);
    socket.on('game_error', onGameError);

    // Cancel any pending disconnect from a previous cleanup (StrictMode re-mount)
    clearTimeout(disconnectTimer);
    socket.connect();

    // If socket is already connected (e.g. room creator navigating from home),
    // the 'connect' event won't fire again — emit join_game immediately.
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('game_created', onGameCreated);
      socket.off('game_state', onGameState);
      socket.off('player_disconnected', onPlayerDisconnected);
      socket.off('game_error', onGameError);
      // Delay disconnect so React StrictMode's unmount+remount cycle
      // doesn't kill the connection. If the effect re-runs (same page),
      // socket.connect() in the new setup will keep it alive.
      disconnectTimer = setTimeout(() => socket.disconnect(), 100);
    };
  }, [roomId, resolveMyColor, clearSelection]);

  function handleRollDice() {
    if (!isMyTurn || !game || game.dice.length > 0) return;
    socket.emit('roll_dice', roomId);
  }

  function handlePointClick(pointIndex: number) {
    if (!isMyTurn || !game || !hasRolled) return;

    // Deselect current selection
    if (selectedSource === pointIndex) {
      clearSelection();
      return;
    }

    // Execute move if clicking a valid destination
    if (selectedSource !== null) {
      const move = validMoves.find((m) => m.to === pointIndex);
      if (move) {
        socket.emit('move_checker', roomId, move);
        clearSelection();
        return;
      }
    }

    // Can't select from board when must enter from bar
    if (game.bar[game.currentTurn] > 0) return;

    // Select a source
    const point = game.points[pointIndex];
    if (point && point.player === myColor && point.count > 0) {
      const moves = getValidMoves(game, pointIndex);
      if (moves.length > 0) {
        setSelectedSource(pointIndex);
        setValidMoves(moves);
        return;
      }
    }

    clearSelection();
  }

  function handleBarClick() {
    if (!isMyTurn || !game || !hasRolled) return;
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
      socket.emit('move_checker', roomId, move);
      clearSelection();
    }
  }

  return {
    game,
    myColor,
    status,
    error,
    isMyTurn,
    selectedSource,
    validDestinations,
    hasRolled: hasRolled && isMyTurn,
    noMovesNotice,
    handleRollDice,
    handlePointClick,
    handleBarClick,
    handleBearOff,
  };
}
