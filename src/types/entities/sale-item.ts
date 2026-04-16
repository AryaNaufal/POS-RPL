export type SaleItem = {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  sku_snapshot: string | null;
  qty: number;
  unit_price: number;
  discount_amount: number;
  tax_amount: number;
  subtotal: number;
  total: number;
  return_qty: number;
  return_reason: string | null;
  created_at: string;
};
