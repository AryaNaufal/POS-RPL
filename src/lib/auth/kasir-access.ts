import { getAccessibleStoreIds } from "@/lib/auth/store-scope";

export async function hasKasirAccess(userId: string) {
  const storeIds = await getAccessibleStoreIds(userId, ["kasir"]);
  return storeIds.length > 0;
}
