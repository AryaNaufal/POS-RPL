import type { SaleStatus } from '../common/enums';

export type Sale = {
  id: string;
  invoice_no: string;
  store_id: string;
  cashier_id: string;
  customer_id: string | null;
  shift_id: string | null;
  status: SaleStatus;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  service_total: number;
  grand_total: number;
  paid_total: number;
  change_total: number;
  note: string | null;
  sold_at: string;
  created_at: string;
};
