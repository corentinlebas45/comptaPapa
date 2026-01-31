export type TransactionType = 'income' | 'expense';

export interface CategoryDef {
  id: string;
  name: string;
  color: string;
}

export const PRESET_COLORS = [
  "#64748b", // Slate
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Amber
  "#84cc16", // Lime
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#d946ef", // Fuchsia
  "#f43f5e", // Rose
  "#0ea5e9", // Sky
  "#14b8a6", // Teal
  "#22c55e", // Green
  "#eab308", // Yellow
  "#ec4899", // Pink
  "#be185d", // Pink darker
  "#a855f7", // Purple
  "#475569", // Slate darker
  "#78716c", // Stone
];

export const DefaultCategories: CategoryDef[] = [
  { id: 'cat_1', name: 'Alimentation', color: '#f59e0b' },
  { id: 'cat_2', name: 'Logement', color: '#3b82f6' },
  { id: 'cat_3', name: 'Transport', color: '#06b6d4' },
  { id: 'cat_4', name: 'Factures', color: '#ef4444' },
  { id: 'cat_5', name: 'Santé', color: '#10b981' },
  { id: 'cat_6', name: 'Loisirs', color: '#8b5cf6' },
  { id: 'cat_7', name: 'Autre', color: '#64748b' },
  { id: 'cat_8', name: 'Salaire', color: '#10b981' },
  { id: 'cat_9', name: 'Investissement', color: '#6366f1' }
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
  statementNumber?: string;
}

export interface AppData {
  transactions: Transaction[];
  initialBalance: number;
  categories?: CategoryDef[];
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
}
