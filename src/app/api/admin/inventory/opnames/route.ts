import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds, hasStoreAccess } from "@/lib/auth/store-scope";
import type { CreateStockOpnameInput } from "@/types/forms/stock-opname-form";

function buildOpnameNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `OPN-${y}${m}${d}-${random}`;
}

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const status = searchParams.get("status");

  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin", "owner"]);
  if (storeIds.length === 0) return NextResponse.json({ data: [] });

  const supabase = createServiceClient();
  let query = supabase
    .from("stock_opnames")
    .select("*, stores(id, name), created_by_user:created_by(id, name)")
    .order("created_at", { ascending: false });

  if (storeId) query = query.eq("store_id", storeId);
  else query = query.in("store_id", storeIds);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as CreateStockOpnameInput | null;

  if (!body?.store_id || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Payload tidak lengkap." }, { status: 400 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, body.store_id, ["admin", "owner"]);
  if (!canAccessStore) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const supabase = createServiceClient();
  const opnameNo = buildOpnameNo();

  const { data: opname, error: insertError } = await supabase
    .from("stock_opnames")
    .insert({
      opname_no: opnameNo,
      store_id: body.store_id,
      status: "draft",
      note: body.note?.trim() || null,
      created_by: auth.session.userId,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  const itemsPayload = body.items.map((item) => ({
    opname_id: opname.id,
    product_id: item.product_id,
    qty_expected: Number(item.qty_expected),
    qty_actual: Number(item.qty_actual),
    adjustment_qty: Number(item.qty_actual) - Number(item.qty_expected),
  }));

  const { error: itemsError } = await supabase.from("stock_opname_items").insert(itemsPayload);
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

  return NextResponse.json({ data: opname });
}
