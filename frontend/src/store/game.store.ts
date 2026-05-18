import { create } from 'zustand';
import type { BoardState, PlayerSymbol, GameStatus } from '../types/game.types';

interface GameStore {
  board: BoardState;
  matchId: string | null;
  currentPlayer: PlayerSymbol;
  playerSymbol: PlayerSymbol | null;
  winner: PlayerSymbol | 'draw' | null;
  status: GameStatus;
  timeLeft: number;
  error: string | null;
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
    error: null
  }),
}));
