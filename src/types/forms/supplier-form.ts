export type CreateSupplierInput = {
  code?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contact_person?: string | null;
};

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

