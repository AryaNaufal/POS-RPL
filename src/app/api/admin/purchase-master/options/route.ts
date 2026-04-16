import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin", "owner"]);
  if (storeIds.length === 0) {
    return NextResponse.json({ data: { stores: [], suppliers: [] } });
  }

  const [{ data: stores, error: storesError }, { data: suppliers, error: suppliersError }] = await Promise.all([
    supabase
      .from("stores")
      .select("id, code, name")
      .eq("is_active", true)
      .in("id", storeIds)
      .order("name", { ascending: true }),
    supabase
      .from("suppliers")
      .select("id, code, name")
      .order("name", { ascending: true })
      .limit(500),
  ]);

  if (storesError || suppliersError) {
    return NextResponse.json(
      { error: storesError?.message ?? suppliersError?.message ?? "Gagal memuat opsi pembelian" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    data: {
      stores: stores ?? [],
      suppliers: suppliers ?? [],
    },
  });
}

