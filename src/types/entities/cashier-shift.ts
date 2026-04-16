import type { ShiftStatus } from '../common/enums';

export type CashierShift = {
  id: string;
  store_id: string;
  cashier_id: string;
  opened_at: string;
  opening_cash: number;
  closed_at: string | null;
  closing_cash: number | null;
  expected_cash: number | null;
  cash_difference: number | null;
  status: ShiftStatus;
  note: string | null;
};

