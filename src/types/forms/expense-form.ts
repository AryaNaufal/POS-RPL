export type CreateExpenseInput = {
  store_id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
};

export type ExpenseFilter = {
  store_id?: string;
  category?: string;
  date_from?: string;
  date_to?: string;
};

