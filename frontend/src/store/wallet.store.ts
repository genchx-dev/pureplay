import { create } from 'zustand';
import { walletApi } from '../services/api/wallet.api';

interface WalletState {
  balance: number;
  loading: boolean;
  fetchBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  loading: false,
  fetchBalance: async () => {
    set({ loading: true });
    try {
      const { data } = await walletApi.getBalance();
      set({ balance: data.balance, loading: false });
    } catch (error) {
      console.error('Failed to fetch balance', error);
      set({ loading: false });
    }
  },
}));
