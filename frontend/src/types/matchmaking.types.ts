export interface JoinQueueRequest {
  gameType: 'tictactoe';
  stake: number;
}

export interface JoinQueueResponse {
  status: 'waiting' | 'matched';
  matchId?: string;
}
