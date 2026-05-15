// src/services/walletService.ts
import api from './api';

export const walletService = {
  lockStake: async (matchId: string, amount: number) => {
    return await api.post('/wallet/lock-stake/', { matchId, amount });
  },
  
  getTransactionHistory: async () => {
    return await api.get('/wallet/transactions/');
  }
};
