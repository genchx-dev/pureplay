import { useWalletStore } from '../store/wallet.store';
import { useEffect } from 'react';

export const useWallet = (autoFetch = false) => {
  const { balance, transactions, loading, error, fetchBalance, fetchTransactions, deposit, withdraw } = useWalletStore();

  useEffect(() => {
    if (autoFetch) {
      fetchBalance();
      fetchTransactions();
    }
  }, [autoFetch, fetchBalance, fetchTransactions]);

  return {
    balance,
    transactions,
    loading,
    error,
    fetchBalance,
    fetchTransactions,
    deposit,
    withdraw,
  };
};
