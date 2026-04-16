export type CreatePurchaseItemInput = {
  product_id: string;
  qty: number;
  unit_cost: number;
  discount_amount: number;
};

export type CreatePurchaseInput = {
  supplier_id?: string | null;
  items: CreatePurchaseItemInput[];
  discount_total: number;
  tax_total: number;
  note?: string | null;
};
