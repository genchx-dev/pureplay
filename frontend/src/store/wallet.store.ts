import { create } from 'zustand';
import { walletApi } from '../services/api/wallet.api';
import type { BankDetails, Transaction } from '../types/wallet.types';

type WalletTransactionResponse = Partial<Transaction> & {
  transaction_type?: Transaction['type'];
  created_at?: string;
};

const normalizeTransaction = (transaction: WalletTransactionResponse): Transaction => ({
  id: String(transaction.id),
  type: transaction.type || transaction.transaction_type || 'deposit',
  amount: Number(transaction.amount || 0),
  date: transaction.date,
  createdAt: transaction.createdAt || transaction.created_at,
  status: transaction.status || 'completed',
  description: transaction.description,
});

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
      set({ balance: Number(data.balance), loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch balance', error);
      set({ loading: false, error: 'Could not load wallet balance' });
    }
  },
  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const { data } = await walletApi.getTransactions();
      set({ transactions: data.map((transaction) => normalizeTransaction(transaction as WalletTransactionResponse)), loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      set({ loading: false, error: 'Could not load transaction history' });
    }
  },
  deposit: async (amount) => {
    set({ loading: true });
    try {
      const { data } = await walletApi.deposit(amount);
      set({ balance: Number(data.balance), loading: false, error: null });
      await useWalletStore.getState().fetchTransactions();
    } catch (error) {
      console.error('Failed to deposit', error);
      set({ loading: false, error: 'Deposit failed' });
      throw error;
    }
  },
  withdraw: async (amount, bankDetails) => {
    set({ loading: true });
    try {
      const { data } = await walletApi.withdraw(amount, bankDetails);
      set({ balance: Number(data.balance), loading: false, error: null });
      await useWalletStore.getState().fetchTransactions();
    } catch (error) {
      console.error('Failed to withdraw', error);
      set({ loading: false, error: 'Withdrawal failed' });
      throw error;
    }
  },
}));
