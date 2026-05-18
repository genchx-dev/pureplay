import { create } from 'zustand';
import { walletApi } from '../services/api/wallet.api';
import type { BankDetails, Transaction } from '../types/wallet.types';

interface WalletState {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number, bankDetails: BankDetails) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: 0,
  transactions: [],
  loading: false,
  error: null,
  fetchBalance: async () => {
    set({ loading: true });
    try {
      const { data } = await walletApi.getBalance();
      set({ balance: data.balance, loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch balance', error);
      set({ loading: false, error: 'Could not load wallet balance' });
    }
  },
  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const { data } = await walletApi.getTransactions();
      set({ transactions: data, loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      set({ loading: false, error: 'Could not load transaction history' });
    }
  },
  deposit: async (amount) => {
    set({ loading: true });
    try {
      const { data } = await walletApi.deposit(amount);
      set((state) => ({ balance: data.balance ?? state.balance, loading: false, error: null }));
      await useWalletStore.getState().fetchTransactions();
    } catch (error) {
      console.error('Failed to deposit', error);
      set({ loading: false, error: 'Deposit failed' });
    }
  },
  withdraw: async (amount, bankDetails) => {
    set({ loading: true });
    try {
      const { data } = await walletApi.withdraw(amount, bankDetails);
      set((state) => ({ balance: data.balance ?? state.balance, loading: false, error: null }));
      await useWalletStore.getState().fetchTransactions();
    } catch (error) {
      console.error('Failed to withdraw', error);
      set({ loading: false, error: 'Withdrawal failed' });
    }
  },
}));
