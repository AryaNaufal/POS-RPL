export type PurchaseItem = {
  id: string;
  purchase_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit_cost: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  return_qty: number;
  return_reason: string | null;
  created_at: string;
};
