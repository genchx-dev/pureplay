import { create } from 'zustand';
import { walletApi } from '../services/api/wallet.api';
import type { BankDetails, Transaction } from '../types/wallet.types';
import { useAuthStore } from './auth.store';

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

const isDemoUser = (username?: string) => {
  if (!username) return false;
  const lower = username.toLowerCase();
  return lower === 'demo' || lower === 'demoplayer';
};

interface WalletState {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  fetchBalance: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  deposit: (amount: number) => Promise<void>;
  verifyDeposit: (reference: string) => Promise<void>;
  withdraw: (amount: number, bankDetails: BankDetails) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  transactions: [],
  loading: false,
  error: null,
  
  fetchBalance: async () => {
    set({ loading: true });
    
    // Support demo account override to 1000 NGN
    const currentUser = useAuthStore.getState().user;
    if (currentUser && isDemoUser(currentUser.username)) {
      const storedDemoBal = localStorage.getItem('demo_balance');
      const bal = storedDemoBal ? Number(storedDemoBal) : 1000;
      if (!storedDemoBal) {
        localStorage.setItem('demo_balance', '1000');
      }
      set({ balance: bal, loading: false, error: null });
      return;
    }

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
    
    // Support demo account override
    const currentUser = useAuthStore.getState().user;
    if (currentUser && isDemoUser(currentUser.username)) {
      const storedTxs = localStorage.getItem('demo_transactions');
      const txs = storedTxs ? JSON.parse(storedTxs) : [];
      set({ transactions: txs, loading: false, error: null });
      return;
    }

    try {
      const { data } = await walletApi.getTransactions();
      set({ transactions: data.map((transaction) => normalizeTransaction(transaction as WalletTransactionResponse)), loading: false, error: null });
    } catch (error) {
      console.error('Failed to fetch transactions', error);
      set({ loading: false, error: 'Could not load transaction history' });
    }
  },
  
  deposit: async (amount) => {
    set({ loading: true, error: null });
    
    const currentUser = useAuthStore.getState().user;
    if (currentUser && isDemoUser(currentUser.username)) {
      const newBal = get().balance + amount;
      const newTx: Transaction = {
        id: `demo_tx_${Date.now()}`,
        type: 'deposit',
        amount,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date().toISOString(),
        status: 'completed',
        description: 'Mock Deposit (Demo)',
      };
      
      set((s) => ({
        balance: newBal,
        transactions: [newTx, ...s.transactions],
        loading: false,
        error: null,
      }));
      return;
    }

    try {
      const { data } = await walletApi.depositInitialize(amount);
      if (data.authorization_url) {
        // Redirect to Paystack
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL received');
      }
    } catch (error) {
      console.error('Failed to deposit', error);
      set({ loading: false, error: 'Deposit failed' });
      throw error;
    }
  },

  verifyDeposit: async (reference) => {
    set({ loading: true, error: null });
    try {
      const { data } = await walletApi.verifyDeposit(reference);
      if (data.status === 'success') {
        await get().fetchBalance();
        await get().fetchTransactions();
      } else {
        set({ error: `Payment status: ${data.status}` });
      }
    } catch (error) {
      console.error('Failed to verify deposit', error);
      set({ error: 'Could not verify payment' });
    } finally {
      set({ loading: false });
    }
  },
  
  withdraw: async (amount, bankDetails) => {
    set({ loading: true });
    
    const currentUser = useAuthStore.getState().user;
    if (currentUser && isDemoUser(currentUser.username)) {
      if (get().balance < amount) {
        set({ loading: false, error: 'Insufficient balance' });
        throw new Error('Insufficient balance');
      }
      
      const newBal = get().balance - amount;
      const newTx: Transaction = {
        id: `demo_tx_${Date.now()}`,
        type: 'withdrawal',
        amount: -amount,
        date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        createdAt: new Date().toISOString(),
        status: 'completed',
        description: `Mock Withdrawal to ${bankDetails.bankName || 'Bank'}`,
      };
      
      set((s) => ({
        balance: newBal,
        transactions: [newTx, ...s.transactions],
        loading: false,
        error: null,
      }));
      return;
    }

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

// Automatically sync demo user states to localStorage
useWalletStore.subscribe((state) => {
  const user = useAuthStore.getState().user;
  if (user && isDemoUser(user.username)) {
    localStorage.setItem('demo_balance', String(state.balance));
    localStorage.setItem('demo_transactions', JSON.stringify(state.transactions));
  }
});

// Reset wallet state when user logs out to prevent cross-user data leakage
useAuthStore.subscribe((state) => {
  if (!state.isAuthenticated) {
    const currentWalletState = useWalletStore.getState();
    if (currentWalletState.balance !== 0 || currentWalletState.transactions.length > 0) {
      useWalletStore.setState({ balance: 0, transactions: [], error: null });
    }
  }
});
