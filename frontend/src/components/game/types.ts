// src/components/game/types.ts

export type Player = 'X' | 'O';
export type BoardState = (Player | null)[];

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  winner: Player | 'Draw' | null;
  status: 'waiting' | 'playing' | 'finished';
}

export interface GameEngine {
  validateMove: (board: BoardState, position: number, player: Player) => boolean;
  makeMove: (board: BoardState, position: number, player: Player) => BoardState;
  checkWinner: (board: BoardState) => Player | 'Draw' | null;
}
