import { useWalletStore } from '../store/wallet.store';
import { useEffect } from 'react';

export const useWallet = (autoFetch = false) => {
  const { balance, loading, fetchBalance } = useWalletStore();

  useEffect(() => {
    if (autoFetch) {
      fetchBalance();
    }
  }, [autoFetch, fetchBalance]);

  return {
    balance,
    loading,
    fetchBalance,
  };
};
