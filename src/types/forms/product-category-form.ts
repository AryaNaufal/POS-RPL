export type CreateCategoryInput = {
  parent_id?: string | null;
  code?: string | null;
  name: string;
  is_active: boolean;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
