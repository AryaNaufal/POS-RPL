export type DashboardSummaryCard = {
  title: string;
  value: string;
  note: string;
};

export type RecentTransactionItem = {
  code: string;
  customer: string;
  total: string;
  status: string;
};

export type LowStockItem = {
  name: string;
  stock: number;
  minStock: number;
  unit: string;
};

