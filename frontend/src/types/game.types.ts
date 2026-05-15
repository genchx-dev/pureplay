export type PlayerSymbol = 'X' | 'O';
export type BoardState = (PlayerSymbol | null)[];
export type GameStatus = 'waiting' | 'playing' | 'finished' | 'draw';

export interface GameState {
  board: BoardState;
  currentPlayer: PlayerSymbol;
  status: GameStatus;
  winner: PlayerSymbol | 'draw' | null;
  timeLeft: number;
}

export interface MatchMove {
  type: 'MAKE_MOVE';
  payload: {
    position: number;
  };
}

export interface MatchEvent {
  type: 'MATCH_START' | 'MOVE_MADE' | 'GAME_OVER' | 'ERROR';
  board?: BoardState;
  nextPlayer?: PlayerSymbol;
  winner?: PlayerSymbol | 'draw';
  message?: string;
}
