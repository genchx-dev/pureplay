import { create } from 'zustand';
import type { BoardState, PlayerSymbol, GameStatus, MatchEvent } from '../types/game.types';

type GamePayout = NonNullable<MatchEvent['payout']>;

interface GameStore {
  board: BoardState;
  matchId: string | null;
  currentPlayer: PlayerSymbol;
  playerSymbol: PlayerSymbol | null;
  winner: PlayerSymbol | 'draw' | null;
  status: GameStatus;
  timeLeft: number;
  error: string | null;
  payout: GamePayout | null;
  player1Username: string | null;
  player2Username: string | null;
  currentRound: number;
  roundScores: Record<string, number>;
  roundWinner: string | 'draw' | null;
  decrementTimer: () => void;
  resetTimer: () => void;
  setTimeLeft: (timeLeft: number) => void;
  setBoard: (board: BoardState) => void;
  setMatchId: (matchId: string | null) => void;
  setWinner: (winner: PlayerSymbol | 'draw' | null) => void;
  setCurrentPlayer: (player: PlayerSymbol) => void;
  setPlayerSymbol: (player: PlayerSymbol | null) => void;
  setStatus: (status: GameStatus) => void;
  setError: (error: string | null) => void;
  setPayout: (payout: GamePayout | null) => void;
  setPlayer1Username: (username: string | null) => void;
  setPlayer2Username: (username: string | null) => void;
  setCurrentRound: (round: number) => void;
  setRoundScores: (scores: Record<string, number>) => void;
  setRoundWinner: (winner: string | 'draw' | null) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  board: Array(9).fill(null),
  matchId: null,
  currentPlayer: 'X',
  playerSymbol: null,
  winner: null,
  status: 'waiting',
  timeLeft: 10,
  error: null,
  payout: null,
  player1Username: null,
  player2Username: null,
  currentRound: 1,
  roundScores: { X: 0, O: 0 },
  roundWinner: null,
  
  decrementTimer: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
  resetTimer: () => set({ timeLeft: 10 }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),
  setBoard: (board) => set({ board }),
  setMatchId: (matchId) => set({ matchId }),
  setWinner: (winner) => set({ winner }),
  setCurrentPlayer: (currentPlayer) => set({ currentPlayer }),
  setPlayerSymbol: (playerSymbol) => set({ playerSymbol }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setPayout: (payout) => set({ payout }),
  setPlayer1Username: (player1Username) => set({ player1Username }),
  setPlayer2Username: (player2Username) => set({ player2Username }),
  setCurrentRound: (currentRound) => set({ currentRound }),
  setRoundScores: (roundScores) => set({ roundScores }),
  setRoundWinner: (roundWinner) => set({ roundWinner }),
  // Logic for turn switching on timeout (Frontend mirror of Backend logic)
  handleTimeout: () => set((state) => ({
    currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
    timeLeft: 10
  })),
  resetGame: () => set({ 
    board: Array(9).fill(null), 
    matchId: null,
    currentPlayer: 'X', 
    playerSymbol: null,
    winner: null, 
    status: 'waiting',
    timeLeft: 10,
    error: null,
    payout: null,
    player1Username: null,
    player2Username: null,
    currentRound: 1,
    roundScores: { X: 0, O: 0 },
    roundWinner: null
  }),
}));
