export type ShiftStatus = 'open' | 'closed';

export type SaleStatus = 'draft' | 'completed' | 'void' | 'refunded';

export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export type MovementType =
  | 'opening'
  | 'sale'
  | 'sale_return'
  | 'purchase'
  | 'purchase_return'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'transfer_in'
  | 'transfer_out';

export type CashMovementType = 'in' | 'out';

export type PaymentMethod = 'cash' | 'qris' | 'card' | 'transfer' | 'ewallet' | 'credit';

export type StockTransferStatus = 'draft' | 'shipped' | 'received' | 'cancelled';

export type StockOpnameStatus = 'draft' | 'completed' | 'cancelled';

