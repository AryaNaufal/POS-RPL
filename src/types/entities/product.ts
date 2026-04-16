export type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_id: string | null;
  buy_price: number;
  sell_price: number;
  min_stock: number;
  track_stock: boolean;
  is_active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
};

