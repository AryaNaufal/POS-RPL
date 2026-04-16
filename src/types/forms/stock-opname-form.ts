export type CreateStockOpnameItemInput = {
  product_id: string;
  qty_expected: number;
  qty_actual: number;
};

export type CreateStockOpnameInput = {
  store_id: string;
  items: CreateStockOpnameItemInput[];
  note?: string | null;
};
