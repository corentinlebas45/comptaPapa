export type TransactionType = 'income' | 'expense';

export const DefaultCategories = [
  'Alimentation',
  'Logement',
  'Transport',
  'Factures',
  'Santé',
  'Loisirs',
  'Autre',
  'Salaire',
  'Investissement'
];

export type Category = string;

// Interfaces
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: Category;
  type: TransactionType;
}

export interface AppData {
  transactions: Transaction[];
  initialBalance: number;
  categories?: string[];
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}
