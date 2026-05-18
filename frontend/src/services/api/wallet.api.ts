import api from './client';
import type { BankDetails, WalletBalance, Transaction } from '../../types/wallet.types';

export const walletApi = {
  getBalance: () => 
    api.get<WalletBalance>('/wallet/balance/'),
    
  getTransactions: () => 
    api.get<Transaction[]>('/wallet/transactions/'),
    
  deposit: (amount: number) => 
    api.post<{ balance: number; transactionId: string }>('/wallet/deposit/', { amount }),
    
  withdraw: (amount: number, bankDetails: BankDetails) => 
    api.post<{ balance: number; transactionId: string }>('/wallet/withdraw/', { amount, bankDetails }),
};
