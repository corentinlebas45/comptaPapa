// Types de base
export type TransactionType = 'income' | 'expense';

// Catégories disponibles
export const CategoryValues = {
  Food: 'Alimentation',
  Housing: 'Logement',
  Transport: 'Transport',
  Utilities: 'Factures',
  Health: 'Santé',
  Leisure: 'Loisirs',
  Other: 'Autre',
  Salary: 'Salaire',
  Investment: 'Investissement'
} as const;

export type Category = (typeof CategoryValues)[keyof typeof CategoryValues];

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
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}
