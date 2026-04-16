export type CreateCustomerInput = {
  code?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
};

export type UpdateCustomerInput = Partial<CreateCustomerInput>;
