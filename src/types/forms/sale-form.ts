import type { PaymentMethod, SaleStatus } from '../common/enums';

export type CreateSaleItemInput = {
  product_id: string;
  qty: number;
  unit_price: number;
  discount_amount: number;
};

export type CreateSaleInput = {
  store_id: string;
  customer_id?: string | null;
  items: CreateSaleItemInput[];
  payments: {
    payment_method: PaymentMethod;
    amount: number;
    reference_no?: string | null;
  }[];
  discount_total: number;
  tax_total: number;
  service_total: number;
  status?: SaleStatus;
  note?: string | null;
};
