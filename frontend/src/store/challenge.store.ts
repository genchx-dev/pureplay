import { create } from 'zustand';
import { matchmakingApi } from '../services/api/matchmaking.api';
import type { IncomingChallenge } from '../types/matchmaking.types';

interface ChallengeState {
  incomingChallenges: IncomingChallenge[];
  sentChallenge: { opponentId: string; opponentName: string; stake: number } | null;
  mockMode: boolean;
  isPolling: boolean;
  
  // Actions
  fetchIncoming: () => Promise<void>;
  sendChallenge: (opponentId: string, opponentName: string, stake: number) => Promise<void>;
  cancelSentChallenge: () => void;
  acceptChallenge: (challengeId: string) => Promise<string>; // Returns matchId
  declineChallenge: (challengeId: string) => Promise<void>;
  
  // Simulation helpers for UI testing
  setMockMode: (enabled: boolean) => void;
  simulateIncoming: (username: string, stake: number) => void;
  clearIncoming: () => void;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  incomingChallenges: [],
  sentChallenge: null,
  mockMode: true, // Default to true so frontend UI simulation works instantly in browser
  isPolling: false,

  fetchIncoming: async () => {
    if (get().isPolling) return;
    set({ isPolling: true });

    try {
      if (get().mockMode) {
        // In mock mode, we preserve whatever was manually simulated via UI buttons
        set({ isPolling: false });
        return;
      }

      const { data } = await matchmakingApi.getIncomingChallenges();
      set({ incomingChallenges: data });
    } catch (error) {
      console.warn('Backend challenges endpoint failed, keeping local simulated state:', error);
      // Fail silently to prevent crashing the dev interface if backend routes aren't ready
    } finally {
      set({ isPolling: false });
    }
  },

  sendChallenge: async (opponentId, opponentName, stake) => {
    set({ sentChallenge: { opponentId, opponentName, stake } });

    if (get().mockMode) {
      // Simulate opponent accepting the invite after 3 seconds
      setTimeout(() => {
        const active = get().sentChallenge;
        if (active && active.opponentId === opponentId) {
          // Trigger redirect by resolving a mock match
          set({ sentChallenge: null });
          window.location.assign('/game/demo?demo=1');
        }
      }, 4000);
      return;
    }

    try {
      const { data } = await matchmakingApi.challengePlayer({
        gameType: 'tictactoe',
        stake,
        opponentId,
      });

      if (data.status === 'matched' && data.matchId) {
        set({ sentChallenge: null });
        window.location.assign(`/game/${data.matchId}`);
      }
    } catch (error) {
      console.error('Failed to send challenge:', error);
      set({ sentChallenge: null });
      throw error;
    }
  },

  cancelSentChallenge: () => {
    set({ sentChallenge: null });
  },

  acceptChallenge: async (challengeId) => {
    if (get().mockMode) {
      // Remove from list and navigate to demo practice game
      set((state) => ({
        incomingChallenges: state.incomingChallenges.filter((c) => c.id !== challengeId),
      }));
      return '/game/demo?demo=1';
    }

    try {
      const { data } = await matchmakingApi.acceptChallenge(challengeId);
      set((state) => ({
        incomingChallenges: state.incomingChallenges.filter((c) => c.id !== challengeId),
      }));
      return `/game/${data.matchId}`;
    } catch (error) {
      console.error('Failed to accept challenge:', error);
      throw error;
    }
  },

  declineChallenge: async (challengeId) => {
    set((state) => ({
      incomingChallenges: state.incomingChallenges.filter((c) => c.id !== challengeId),
    }));

    if (get().mockMode) return;

    try {
      await matchmakingApi.declineChallenge(challengeId);
    } catch (error) {
      console.error('Failed to decline challenge:', error);
    }
  },

  setMockMode: (mockMode) => set({ mockMode }),

  simulateIncoming: (username, stake) => {
    const mockChallenge: IncomingChallenge = {
      id: `mock_${Date.now()}`,
      gameType: 'tictactoe',
      stake,
      challenger: {
        id: `user_${Math.floor(Math.random() * 1000)}`,
        username,
        tier: 'Bronze',
        rank: 1000 + Math.floor(Math.random() * 200),
      },
    };

    set((state) => ({
      incomingChallenges: [...state.incomingChallenges, mockChallenge],
    }));
  },

  clearIncoming: () => set({ incomingChallenges: [] }),
}));
