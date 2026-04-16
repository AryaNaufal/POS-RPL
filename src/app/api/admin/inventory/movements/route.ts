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
  const productId = searchParams.get("productId");
  const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

  const supabase = createServiceClient();
  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin"]);
  if (storeIds.length === 0) {
    return NextResponse.json({ error: "Akses store tidak ditemukan" }, { status: 403 });
  }

  let query = supabase
    .from("stock_movements")
    .select(
      "id, movement_type, qty, note, created_at, store_id, product_id, products(id, sku, name), stores(id, code, name), users(id, name, email)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (storeId) {
    if (!storeIds.includes(storeId)) {
      return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
    }
    query = query.eq("store_id", storeId);
  } else {
    query = query.in("store_id", storeIds);
  }
  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

