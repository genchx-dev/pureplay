export type PlayerSymbol = 'X' | 'O';
export type BoardState = (PlayerSymbol | null)[];
export type GameStatus = 'waiting' | 'connecting' | 'playing' | 'finished' | 'draw' | 'error';

export interface SeriesInfo {
  id: string;
  player1_wins: number;
  player2_wins: number;
  is_complete: boolean;
}

export interface GameState {
  board: BoardState;
  matchId: string | null;
  currentPlayer: PlayerSymbol;
  playerSymbol: PlayerSymbol | null;
  status: GameStatus;
  winner: PlayerSymbol | 'draw' | null;
  timeLeft: number;
  error: string | null;
  series: SeriesInfo | null;
}

export interface MatchMove {
  type: 'MAKE_MOVE';
  payload: {
    position: number;
  };
}

export interface MatchEvent {
  type: 'MATCH_START' | 'MOVE_MADE' | 'TURN_SKIP' | 'GAME_OVER' | 'ERROR' | 'NEXT_MATCH';
  matchId?: string;
  board?: BoardState;
  currentPlayer?: PlayerSymbol;
  nextPlayer?: PlayerSymbol;
  playerSymbol?: PlayerSymbol;
  winner?: PlayerSymbol | 'draw';
  turnEndsAt?: string;
  message?: string;
  series?: SeriesInfo | null;
  player1Username?: string;
  player2Username?: string;
  payout?: {
    winnerAmount?: number;
    platformFee?: number;
  };
}
