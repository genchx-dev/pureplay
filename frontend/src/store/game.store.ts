import { create } from 'zustand';
import type { BoardState, PlayerSymbol, GameStatus } from '../types/game.types';

interface GameStore {
  board: BoardState;
  currentPlayer: PlayerSymbol;
  winner: PlayerSymbol | 'draw' | null;
  status: GameStatus;
  timeLeft: number;
  decrementTimer: () => void;
  resetTimer: () => void;
  setBoard: (board: BoardState) => void;
  setWinner: (winner: PlayerSymbol | 'draw' | null) => void;
  setCurrentPlayer: (player: PlayerSymbol) => void;
  setStatus: (status: GameStatus) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  board: Array(9).fill(null),
  currentPlayer: 'X',
  winner: null,
  status: 'waiting',
  timeLeft: 10,
  
  decrementTimer: () => set((state) => ({ timeLeft: Math.max(0, state.timeLeft - 1) })),
  resetTimer: () => set({ timeLeft: 10 }),
  setBoard: (board) => set({ board }),
  setWinner: (winner) => set({ winner }),
  setCurrentPlayer: (currentPlayer) => set({ currentPlayer }),
  setStatus: (status) => set({ status }),
  // Logic for turn switching on timeout (Frontend mirror of Backend logic)
  handleTimeout: () => set((state) => ({
    currentPlayer: state.currentPlayer === 'X' ? 'O' : 'X',
    timeLeft: 10
  })),
  resetGame: () => set({ 
    board: Array(9).fill(null), 
    currentPlayer: 'X', 
    winner: null, 
    status: 'playing',
    timeLeft: 10
  }),
}));
