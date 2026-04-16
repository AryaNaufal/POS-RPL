import { createServiceClient } from "@/lib/supabase/service";
import { AssignmentRow } from "@/types/auth/store-scope";
import { StoreRoleCode, STORE_ROLE_MATRIX } from "@/types/auth/permission";

function uniqueRoleCodes(codes: readonly StoreRoleCode[]) {
  return [...new Set(codes)] as StoreRoleCode[];
}

export async function getAccessibleStoreIds(
  userId: string,
  allowedRoles: readonly StoreRoleCode[]
) {
  const roleCodes = uniqueRoleCodes(allowedRoles);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("user_store_roles")
    .select("store_id, roles!inner(code)")
    .eq("user_id", userId)
    .eq("is_active", true)
    .in("roles.code", [...roleCodes]);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as AssignmentRow[];
  return [...new Set(rows.map((row) => row.store_id))];
}

export async function hasStoreAccess(
  userId: string,
  storeId: string,
  allowedRoles: readonly StoreRoleCode[]
) {
  const roleCodes = uniqueRoleCodes(allowedRoles);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("user_store_roles")
    .select("id, roles!inner(code)")
    .eq("user_id", userId)
    .eq("store_id", storeId)
    .eq("is_active", true)
    .in("roles.code", [...roleCodes])
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return (data?.length ?? 0) > 0;
}

