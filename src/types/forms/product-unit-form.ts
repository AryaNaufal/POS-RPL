export type CreateUnitInput = {
  name: string;
  symbol: string;
};

export type UpdateUnitInput = Partial<CreateUnitInput>;
