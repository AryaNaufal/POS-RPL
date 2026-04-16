export type SalesReportRow = {
  date: string;
  count: number;
  total: number;
  items_sold: number;
};

export type PurchaseReportRow = {
  date: string;
  count: number;
  total: number;
};

export type ProfitReportRow = {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
};

export type StockReportRow = {
  products: {
    id: string;
    name: string;
    sku: string;
    buy_price: number;
  };
  stores: {
    id: string;
    name: string;
  };
  qty_on_hand: number;
};

export type CashReportRow = {
  date: string;
  cashIn: number;
  cashOut: number;
};

export type ReportFilter = {
  date_from: string;
  date_to: string;
  store_id?: string;
};

