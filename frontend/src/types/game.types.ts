export type PlayerSymbol = 'X' | 'O';
export type BoardState = (PlayerSymbol | null)[] | Record<string, string> | any;
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
  gameType?: 'tictactoe' | 'chess' | 'whot';
  boardTheme?: string;
  customStyles?: Record<string, any>;
  legalMoves?: string[];
  fen?: string;
}

export interface MatchMove {
  type: 'MAKE_MOVE';
  payload: {
    position: number | string | any;
  };
}

export interface MatchEvent {
  type: 'MATCH_START' | 'MOVE_MADE' | 'TURN_SKIP' | 'GAME_OVER' | 'ERROR' | 'NEXT_MATCH' | 'ROUND_OVER';
  matchId?: string;
  board?: BoardState;
  currentPlayer?: PlayerSymbol;
  nextPlayer?: PlayerSymbol;
  playerSymbol?: PlayerSymbol;
  winner?: PlayerSymbol | 'draw';
  roundWinner?: PlayerSymbol | 'draw';
  currentRound?: number;
  roundScores?: Record<PlayerSymbol, number>;
  turnEndsAt?: string;
  message?: string;
  series?: SeriesInfo | null;
  player1Username?: string;
  player2Username?: string;
  payout?: {
    winnerAmount?: number;
    platformFee?: number;
  };
  gameType?: 'tictactoe' | 'chess' | 'whot';
  boardTheme?: string;
  customStyles?: Record<string, any>;
  legalMoves?: string[];
  fen?: string;
  isTournament?: boolean;
  tournamentId?: string | null;
  tournamentRoundNumber?: number | null;
  isTournamentFinal?: boolean;
}
