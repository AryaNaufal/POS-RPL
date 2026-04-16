import type { StockTransferStatus } from '../common/enums';

export type StockTransfer = {
  id: string;
  transfer_no: string;
  from_store_id: string;
  to_store_id: string;
  status: StockTransferStatus;
  note: string | null;
  created_by: string | null;
  shipped_at: string | null;
  received_at: string | null;
  created_at: string;
  updated_at: string;
};
