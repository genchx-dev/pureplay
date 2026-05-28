import { WSEvent } from './events';
import { useGameStore } from '../../store/game.store';
import type { MatchEvent } from '../../types/game.types';

const getSecondsLeft = (turnEndsAt?: string, gameType: 'tictactoe' | 'chess' | 'whot' = 'tictactoe') => {
  if (!turnEndsAt) return gameType === 'chess' ? 20 : (gameType === 'whot' ? 15 : 10);
  return Math.max(0, Math.ceil((new Date(turnEndsAt).getTime() - Date.now()) / 1000));
};

export const handleWSMessage = (event: MessageEvent) => {
  try {
    const data = JSON.parse(event.data) as MatchEvent;
    console.log('WS Message:', data);
    const gameStore = useGameStore.getState();
    const gameType = data.gameType || gameStore.gameType;
    
    switch (data.type) {
      case WSEvent.MOVE_MADE:
        if (data.board) gameStore.setBoard(data.board);
        if (data.nextPlayer) gameStore.setCurrentPlayer(data.nextPlayer);
        if (data.series) gameStore.setSeries(data.series);
        if (data.gameType) gameStore.setGameType(data.gameType);
        if (data.boardTheme) gameStore.setBoardTheme(data.boardTheme);
        if (data.customStyles) gameStore.setCustomStyles(data.customStyles);
        if (data.legalMoves) gameStore.setLegalMoves(data.legalMoves);
        if (data.fen !== undefined) gameStore.setFen(data.fen);
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt, gameType));
        gameStore.setError(null);
        break;
      case WSEvent.MATCH_START:
        gameStore.setStatus('playing');
        gameStore.setError(null);
        if (data.matchId) gameStore.setMatchId(data.matchId);
        if (data.board) gameStore.setBoard(data.board);
        if (data.currentPlayer) gameStore.setCurrentPlayer(data.currentPlayer);
        if (data.playerSymbol) gameStore.setPlayerSymbol(data.playerSymbol);
        if (data.series) gameStore.setSeries(data.series);
        if (data.player1Username) gameStore.setPlayer1Username(data.player1Username);
        if (data.player2Username) gameStore.setPlayer2Username(data.player2Username);
        if (data.currentRound) gameStore.setCurrentRound(data.currentRound);
        if (data.roundScores) gameStore.setRoundScores(data.roundScores);
        if (data.gameType) gameStore.setGameType(data.gameType);
        if (data.boardTheme) gameStore.setBoardTheme(data.boardTheme);
        if (data.customStyles) gameStore.setCustomStyles(data.customStyles);
        if (data.legalMoves) gameStore.setLegalMoves(data.legalMoves);
        if (data.fen !== undefined) gameStore.setFen(data.fen);
        if (data.isTournament !== undefined) gameStore.setIsTournament(data.isTournament);
        if (data.tournamentId !== undefined) gameStore.setTournamentId(data.tournamentId);
        if (data.tournamentRoundNumber !== undefined) gameStore.setTournamentRoundNumber(data.tournamentRoundNumber);
        if (data.isTournamentFinal !== undefined) gameStore.setIsTournamentFinal(data.isTournamentFinal || false);
        gameStore.setRoundWinner(null);
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt, gameType));
        break;
      case WSEvent.ROUND_OVER:
        console.log('Round Over:', data.roundWinner);
        if (data.roundWinner) gameStore.setRoundWinner(data.roundWinner);
        if (data.currentRound) gameStore.setCurrentRound(data.currentRound);
        if (data.roundScores) gameStore.setRoundScores(data.roundScores);
        if (data.board) gameStore.setBoard(data.board);
        if (data.currentPlayer) gameStore.setCurrentPlayer(data.currentPlayer);
        if (data.series) gameStore.setSeries(data.series);
        if (data.gameType) gameStore.setGameType(data.gameType);
        if (data.boardTheme) gameStore.setBoardTheme(data.boardTheme);
        if (data.customStyles) gameStore.setCustomStyles(data.customStyles);
        if (data.legalMoves) gameStore.setLegalMoves(data.legalMoves);
        if (data.fen !== undefined) gameStore.setFen(data.fen);
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt, gameType));
        gameStore.setError(null);
        break;
      case WSEvent.TURN_SKIP:
        if (data.board) gameStore.setBoard(data.board);
        if (data.nextPlayer) gameStore.setCurrentPlayer(data.nextPlayer);
        if (data.series) gameStore.setSeries(data.series);
        if (data.gameType) gameStore.setGameType(data.gameType);
        if (data.boardTheme) gameStore.setBoardTheme(data.boardTheme);
        if (data.customStyles) gameStore.setCustomStyles(data.customStyles);
        if (data.legalMoves) gameStore.setLegalMoves(data.legalMoves);
        if (data.fen !== undefined) gameStore.setFen(data.fen);
        gameStore.setTimeLeft(getSecondsLeft(data.turnEndsAt, gameType));
        gameStore.setError(null);
        break;
      case WSEvent.GAME_OVER:
        console.log('Game Over:', data.winner);
        if (data.board) gameStore.setBoard(data.board);
        if (data.winner) gameStore.setWinner(data.winner);
        if (data.series) gameStore.setSeries(data.series);
        if (data.gameType) gameStore.setGameType(data.gameType);
        if (data.boardTheme) gameStore.setBoardTheme(data.boardTheme);
        if (data.customStyles) gameStore.setCustomStyles(data.customStyles);
        if (data.fen !== undefined) gameStore.setFen(data.fen);
        gameStore.setPayout(data.payout || null);
        gameStore.setStatus(data.winner === 'draw' ? 'draw' : 'finished');
        gameStore.setTimeLeft(0);
        break;
      case WSEvent.NEXT_MATCH:
        if (data.matchId) {
          // Update matchId in store so hook can reconnect
          gameStore.setMatchId(data.matchId);
          // status is reset by resetGame in useGameSocket but we can also do it here
        }
        break;
      case WSEvent.ERROR:
        console.error('WS Error message:', data.message);
        gameStore.setError(data.message || 'Something went wrong');
        break;
      default:
        console.warn('Unhandled WS event type:', data.type);
        break;
    }
  } catch (err) {
    console.error('Failed to parse WS message', err);
  }
};
