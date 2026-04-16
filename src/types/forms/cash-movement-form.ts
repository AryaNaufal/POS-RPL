import type { CashMovementType } from '../common/enums';

export type CreateCashMovementInput = {
  store_id: string;
  shift_id?: string | null;
  movement_type: CashMovementType;
  amount: number;
  reason: string;
  reference_type?: string | null;
  reference_id?: string | null;
};
