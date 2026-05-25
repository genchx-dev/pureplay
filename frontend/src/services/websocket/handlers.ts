import { WSEvent } from './events';
import { useGameStore } from '../../store/game.store';
import type { MatchEvent } from '../../types/game.types';

const getSecondsLeft = (turnEndsAt?: string) => {
  if (!turnEndsAt) return 10;
  return Math.max(0, Math.ceil((new Date(turnEndsAt).getTime() - Date.now()) / 1000));
};

export const handleWSMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data) as MatchEvent;
    console.log('WS Message:', data);
    const gameStore = useGameStore.getState();
    
    switch (data.type) {
      case WSEvent.MOVE_MADE:
        if (data.board) gameStore.setBoard(data.board);
        if (data.nextPlayer) gameStore.setCurrentPlayer(data.nextPlayer);
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt));
        gameStore.setError(null);
        break;
      case WSEvent.MATCH_START:
        gameStore.setStatus('playing');
        gameStore.setError(null);
        if (data.matchId) gameStore.setMatchId(data.matchId);
        if (data.board) gameStore.setBoard(data.board);
        if (data.currentPlayer) gameStore.setCurrentPlayer(data.currentPlayer);
        if (data.playerSymbol) gameStore.setPlayerSymbol(data.playerSymbol);
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt));
        break;
      case WSEvent.TURN_SKIP:
        if (data.board) gameStore.setBoard(data.board);
        if (data.nextPlayer) gameStore.setCurrentPlayer(data.nextPlayer);
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt));
        gameStore.setError(null);
        break;
      case WSEvent.GAME_OVER:
        console.log('Game Over:', data.winner);
        if (data.board) gameStore.setBoard(data.board);
        if (data.winner) gameStore.setWinner(data.winner);
        gameStore.setPayout(data.payout || null);
        gameStore.setStatus(data.winner === 'draw' ? 'draw' : 'finished');
        gameStore.setTimeLeft(0);
        break;
      case WSEvent.ERROR:
        console.error('WS Error message:', data.message);
        gameStore.setError(data.message || 'Something went wrong');
        break;
      default:
        console.warn('Unhandled WS event type:', data.type);
    }
  } catch (err) {
    console.error('Failed to parse WS message', err);
  }
};
