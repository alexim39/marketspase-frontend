// transaction.model.ts (new file)
export interface Transaction {
  amount: number;
  type: 'credit' | 'debit';
  category: 'deposit' | 'withdrawal' | 'campaign' | 'promotion' | 'bonus' | 'fee' | 'refund';
  description?: string;
  status: 'pending' | 'successful' | 'failed';
  createdAt: string;
}

export interface Wallet {
  balance: number;
  reserved: number;
  transactions: Transaction[];
}