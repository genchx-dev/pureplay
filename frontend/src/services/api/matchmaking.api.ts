import api from './client';
import type {
  AvailablePlayer,
  AcceptOpenMatchRequest,
  ChallengePlayerRequest,
  ChallengePlayerResponse,
  JoinQueueRequest,
  JoinQueueResponse,
  OpenMatch,
  IncomingChallenge,
} from '../../types/matchmaking.types';

export const matchmakingApi = {
  joinQueue: (request: JoinQueueRequest) =>
    api.post<JoinQueueResponse>('/matchmaking/queue/', request),

  cancelQueue: () =>
    api.post<{ status: 'cancelled' }>('/matchmaking/queue/cancel/'),

  getOpenMatches: (gameType: 'tictactoe' | 'chess', stake?: number) =>
    api.get<OpenMatch[]>('/matchmaking/open-matches/', {
      params: { gameType, ...(stake ? { stake } : {}) },
    }),

  acceptOpenMatch: (request: AcceptOpenMatchRequest) =>
    api.post<JoinQueueResponse>('/matchmaking/open-matches/accept/', request),

  getAvailablePlayers: (gameType: 'tictactoe' | 'chess', stake: number) =>
    api.get<AvailablePlayer[]>('/matchmaking/available-players/', {
      params: { gameType, stake },
    }),

  challengePlayer: (request: ChallengePlayerRequest) =>
    api.post<ChallengePlayerResponse>('/matchmaking/challenge/', request),

  getIncomingChallenges: () =>
    api.get<IncomingChallenge[]>('/matchmaking/challenges/incoming/'),

  acceptChallenge: (challengeId: string) =>
    api.post<{ status: 'matched'; matchId: string }>(`/matchmaking/challenges/${challengeId}/accept/`),

  declineChallenge: (challengeId: string) =>
    api.post<{ status: 'declined' }>(`/matchmaking/challenges/${challengeId}/decline/`),
};
