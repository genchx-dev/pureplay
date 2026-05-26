import { useWalletStore } from '../store/wallet.store';
import { useEffect } from 'react';

export const useWallet = (autoFetch = false) => {
  const { balance, transactions, loading, error, fetchBalance, fetchTransactions, deposit, verifyDeposit, withdraw } = useWalletStore();

  useEffect(() => {
    if (autoFetch) {
      fetchBalance();
      fetchTransactions();

      // Set up polling for balance and transactions every 10 seconds
      const intervalId = setInterval(() => {
        fetchBalance();
        fetchTransactions();
      }, 10000);

      return () => clearInterval(intervalId);
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
    verifyDeposit,
    withdraw,
  };
};
