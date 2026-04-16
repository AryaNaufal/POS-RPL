import type { PaymentMethod } from '../common/enums';

export type SalePayment = {
  id: string;
  sale_id: string;
  payment_method: PaymentMethod;
  amount: number;
  reference_no: string | null;
  paid_at: string;
};

