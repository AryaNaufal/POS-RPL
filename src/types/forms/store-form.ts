export type CreateStoreInput = {
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  is_active: boolean;
};

export type UpdateStoreInput = Partial<CreateStoreInput>;

