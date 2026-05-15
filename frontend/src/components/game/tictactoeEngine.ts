// src/components/game/tictactoeEngine.ts
import type { GameEngine } from './types';

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6]             // diagonals
];

export const ticTacToeEngine: GameEngine = {
  validateMove: (board, position) => {
    return board[position] === null;
  },

  makeMove: (board, position, player) => {
    const newBoard = [...board];
    newBoard[position] = player;
    return newBoard;
  },

  checkWinner: (board) => {
    for (const combo of WINNING_COMBINATIONS) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return board.includes(null) ? null : 'Draw';
  }
};
