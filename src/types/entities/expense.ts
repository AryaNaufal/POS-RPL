export type Expense = {
  id: string;
  store_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  paid_by: string | null;
  created_at: string;
};

