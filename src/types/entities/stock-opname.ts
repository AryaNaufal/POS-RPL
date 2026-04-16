import type { StockOpnameStatus } from '../common/enums';

export type StockOpname = {
  id: string;
  opname_no: string;
  store_id: string;
  status: StockOpnameStatus;
  note: string | null;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

