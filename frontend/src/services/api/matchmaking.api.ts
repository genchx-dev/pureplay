import api from './client';
import type {
  AvailablePlayer,
  ChallengePlayerRequest,
  ChallengePlayerResponse,
  JoinQueueRequest,
  JoinQueueResponse,
} from '../../types/matchmaking.types';

export const matchmakingApi = {
  joinQueue: (request: JoinQueueRequest) =>
    api.post<JoinQueueResponse>('/matchmaking/queue/', request),

  getAvailablePlayers: (gameType: 'tictactoe', stake: number) =>
    api.get<AvailablePlayer[]>('/matchmaking/available-players/', {
      params: { gameType, stake },
    }),

  challengePlayer: (request: ChallengePlayerRequest) =>
    api.post<ChallengePlayerResponse>('/matchmaking/challenge/', request),
};
