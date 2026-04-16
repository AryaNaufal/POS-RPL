export type ProductCategory = {
  id: string;
  parent_id: string | null;
  code: string | null;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
