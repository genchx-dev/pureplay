export type PlayerSymbol = 'X' | 'O';
export type BoardState = (PlayerSymbol | null)[];
export type GameStatus = 'waiting' | 'connecting' | 'playing' | 'finished' | 'draw' | 'error';

export interface GameState {
  board: BoardState;
  matchId: string | null;
  currentPlayer: PlayerSymbol;
  playerSymbol: PlayerSymbol | null;
  status: GameStatus;
  winner: PlayerSymbol | 'draw' | null;
  timeLeft: number;
  error: string | null;
}

export interface MatchMove {
  type: 'MAKE_MOVE';
  payload: {
    position: number;
  };
}

export interface MatchEvent {
  type: 'MATCH_START' | 'MOVE_MADE' | 'TURN_SKIP' | 'GAME_OVER' | 'ERROR';
  matchId?: string;
  board?: BoardState;
  currentPlayer?: PlayerSymbol;
  nextPlayer?: PlayerSymbol;
  playerSymbol?: PlayerSymbol;
  winner?: PlayerSymbol | 'draw';
  turnEndsAt?: string;
  message?: string;
  payout?: {
    winnerAmount?: number;
    platformFee?: number;
  };
}
