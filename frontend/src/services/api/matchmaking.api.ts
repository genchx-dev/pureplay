import api from './client';
import type { JoinQueueRequest, JoinQueueResponse } from '../../types/matchmaking.types';

export const matchmakingApi = {
  joinQueue: (request: JoinQueueRequest) =>
    api.post<JoinQueueResponse>('/matchmaking/queue/', request),
};
