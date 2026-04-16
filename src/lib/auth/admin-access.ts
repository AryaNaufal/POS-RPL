import { getAccessibleStoreIds } from "@/lib/auth/store-scope";

export async function hasAdminAccess(userId: string) {
  const storeIds = await getAccessibleStoreIds(userId, ["admin", "owner"]);
  return storeIds.length > 0;
}
