export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'stake' | 'win' | 'refund';
  amount: number;
  date?: string;
  createdAt?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
}

export interface WalletBalance {
  balance: number;
  lockedBalance?: number;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}
