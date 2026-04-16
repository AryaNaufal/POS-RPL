import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const keyword = searchParams.get("keyword")?.trim();

  const supabase = createServiceClient();
  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin"]);
  if (storeIds.length === 0) {
    return NextResponse.json({ error: "Akses store tidak ditemukan" }, { status: 403 });
  }

  let query = supabase
    .from("product_stocks")
    .select(
      "id, qty_on_hand, store_id, product_id, stores(id, name, code), products(id, sku, name, min_stock, is_active)"
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (storeId) {
    if (!storeIds.includes(storeId)) {
      return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
    }
    query = query.eq("store_id", storeId);
  } else {
    query = query.in("store_id", storeIds);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const filtered = (data ?? []).filter((row: any) => {
    if (!keyword) return true;
    const key = keyword.toLowerCase();
    return (
      row?.products?.name?.toLowerCase().includes(key) ||
      row?.products?.sku?.toLowerCase().includes(key)
    );
  });

  return NextResponse.json({ data: filtered });
}

