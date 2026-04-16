import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const keyword = searchParams.get("keyword")?.trim();
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin"]);
  if (storeIds.length === 0) return NextResponse.json({ data: [] });

  if (storeId && !storeIds.includes(storeId)) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("sales")
    .select(
      "id, invoice_no, store_id, cashier_id, customer_id, status, subtotal, discount_total, tax_total, service_total, grand_total, paid_total, change_total, note, sold_at, created_at, stores(id, name), customers(id, name), users:cashier_id(id, name, email)"
    )
    .order("sold_at", { ascending: false })
    .limit(limit);

  query = (storeId ? query.eq("store_id", storeId) : query.in("store_id", storeIds)).eq("status", "completed");
  if (keyword) query = query.ilike("invoice_no", `%${keyword}%`);
  if (dateFrom) query = query.gte("sold_at", dateFrom);
  if (dateTo) query = query.lte("sold_at", dateTo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] });
}

