// transaction.model.ts (new file)
export interface Transaction {
  _id?: string;
  amount: number;
  baseAmount?: number;
  settlementAmount?: number;
  currency?: string;
  baseCurrency?: string;
  settlementCurrency?: string;
  exchangeRate?: number;
  type: 'credit' | 'debit';
  category: 'deposit' | 'withdrawal' | 'campaign' | 'promotion' | 'bonus' | 'fee' | 'refund';
  description?: string;
  status: 'pending' | 'successful' | 'failed' | 'processing' | 'completed' | string;
  createdAt: string;
  amountPayable?: number;
}

export interface Wallet {
  balance: number;
  reserved: number;
  currency?: string;
  baseCurrency?: string;
  balancesByCurrency?: Record<string, number>;
  reservedByCurrency?: Record<string, number>;
  transactions: Transaction[];
}
