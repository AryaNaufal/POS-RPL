export const STORE_ROLE_MATRIX = {
  admin: ["admin", "kasir"],
  kasir: ["kasir"],
} as const;

export type StoreRoleCode = keyof typeof STORE_ROLE_MATRIX;

export type Permission = {
  action: string;
  subject: string;
};

