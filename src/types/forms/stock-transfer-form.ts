export type CreateStockTransferItemInput = {
  product_id: string;
  qty: number;
};

export type CreateStockTransferInput = {
  from_store_id: string;
  to_store_id: string;
  items: CreateStockTransferItemInput[];
  note?: string | null;
};

