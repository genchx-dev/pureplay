import { useEffect } from 'react';
import { useGameStore } from '../store/game.store';
import { connectWebSocket, disconnectWebSocket, sendMove } from '../services/websocket/socket';

export const useGameSocket = (matchId?: string) => {
  const { board, timeLeft, status, currentPlayer } = useGameStore();

  useEffect(() => {
    if (matchId) {
      connectWebSocket(matchId);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [matchId]);

  return {
    board,
    timeLeft,
    status,
    currentPlayer,
    sendMove,
  };
};
