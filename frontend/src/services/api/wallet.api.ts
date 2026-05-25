import api from './client';
import type { BankDetails, WalletBalance, Transaction } from '../../types/wallet.types';

export const walletApi = {
  getBalance: () => 
    api.get<WalletBalance>('/wallet/balance/'),
    
  getTransactions: () => 
    api.get<Transaction[]>('/wallet/transactions/'),
    
  deposit: (amount: number) => 
    api.post<{ balance: number; transactionId: string }>('/wallet/deposit/', { amount }),

  depositInitialize: (amount: number) =>
    api.post<{ authorization_url: string; reference: string }>('/wallet/deposit/initialize/', { amount }),

  verifyDeposit: (reference: string) =>
    api.get<{ status: string; amount: number }>(`/wallet/deposit/verify/?reference=${reference}`),
    
  withdraw: (amount: number, bankDetails: BankDetails) => 
    api.post<{ balance: number; transactionId: string }>('/wallet/withdraw/', { amount, bankDetails }),
};
