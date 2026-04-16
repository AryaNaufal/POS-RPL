import type { MovementType } from '../common/enums';

export type StockMovement = {
  id: string;
  product_id: string;
  store_id: string;
  movement_type: MovementType;
  qty: number;
  unit_cost: number | null;
  reference_type: string | null;
  reference_id: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};
