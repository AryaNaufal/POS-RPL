import type { PurchaseStatus } from '../common/enums';

export type Purchase = {
  id: string;
  purchase_no: string;
  store_id: string;
  supplier_id: string | null;
  created_by: string | null;
  status: PurchaseStatus;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
  note: string | null;
  ordered_at: string;
  received_at: string | null;
  created_at: string;
};
