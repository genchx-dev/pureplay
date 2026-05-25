import { WSEvent } from './events';
import { useGameStore } from '../../store/game.store';
import { useAuthStore } from '../../store/auth.store';
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
        
        // Parse and set usernames (with smart backward-compatible fallback)
        {
          const currentUser = useAuthStore.getState().user?.username || 'YOU';
          const symbol = data.playerSymbol || 'X';
          let p1 = data.player1Username;
          let p2 = data.player2Username;
          
          if (!p1 || !p2) {
            if (symbol === 'X') {
              p1 = currentUser;
              p2 = 'OPPONENT';
            } else {
              p1 = 'OPPONENT';
              p2 = currentUser;
            }
          }
          gameStore.setPlayer1Username(p1);
          gameStore.setPlayer2Username(p2);
        }
        
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt));
        break;
      case WSEvent.TURN_SKIP:
        if (data.board) gameStore.setBoard(data.board);
        if (data.nextPlayer) gameStore.setCurrentPlayer(data.nextPlayer);
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt));
        gameStore.setError(null);
        break;
      case WSEvent.ROUND_OVER:
        console.log('Round Over:', data.roundWinner);
        if (data.board) gameStore.setBoard(data.board);
        if (data.roundWinner) gameStore.setRoundWinner(data.roundWinner);
        if (data.currentRound) gameStore.setCurrentRound(data.currentRound);
        if (data.roundScores) gameStore.setRoundScores(data.roundScores);
        gameStore.setTimeLeft(0);
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
