import { useEffect } from 'react';
import { useGameStore } from '../store/game.store';
import { connectWebSocket, disconnectWebSocket, sendMove } from '../services/websocket/socket';

export const useGameSocket = (matchId?: string) => {
  const {
    board,
    timeLeft,
    status,
    currentPlayer,
    playerSymbol,
    winner,
    error,
    payout,
    series,
    decrementTimer,
    resetGame
  } = useGameStore();

  useEffect(() => {
    if (matchId) {
      resetGame();
      connectWebSocket(matchId);
    }
    return () => {
      disconnectWebSocket();
    };
  }, [matchId, resetGame]);

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => {
      decrementTimer();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [decrementTimer, status]);

  const reconnect = () => {
    if (matchId) {
      connectWebSocket(matchId);
    }
  };

  return {
    board,
    timeLeft,
    status,
    currentPlayer,
    playerSymbol,
    winner,
    error,
    payout,
    series,
    sendMove,
    reconnect,
  };
};
