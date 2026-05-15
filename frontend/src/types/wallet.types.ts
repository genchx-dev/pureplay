export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'stake' | 'win' | 'refund';
  amount: number;
  date: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string;
}

export interface WalletBalance {
  balance: number;
  lockedBalance: number;
}
