import api from './client';
import type { WalletBalance, Transaction } from '../../types/wallet.types';

export const walletApi = {
  getBalance: () => 
    api.get<WalletBalance>('/wallet/balance/'),
    
  getTransactions: () => 
    api.get<Transaction[]>('/wallet/transactions/'),
    
  deposit: (amount: number) => 
    api.post('/wallet/deposit/', { amount }),
    
  withdraw: (amount: number, bankDetails: any) => 
    api.post('/wallet/withdraw/', { amount, bankDetails }),
};
