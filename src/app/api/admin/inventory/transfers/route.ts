import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds, hasStoreAccess } from "@/lib/auth/store-scope";
import type { CreateStockTransferInput } from "@/types/forms/stock-transfer-form";

function buildTransferNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TRF-${y}${m}${d}-${random}`;
}

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const fromStoreId = searchParams.get("fromStoreId");
  const toStoreId = searchParams.get("toStoreId");
  const status = searchParams.get("status");

  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin", "owner"]);
  if (storeIds.length === 0) return NextResponse.json({ data: [] });

  const supabase = createServiceClient();
  let query = supabase
    .from("stock_transfers")
    .select("*, from_store:from_store_id(id, name), to_store:to_store_id(id, name), created_by_user:created_by(id, name)")
    .order("created_at", { ascending: false });

  if (fromStoreId) query = query.eq("from_store_id", fromStoreId);
  if (toStoreId) query = query.eq("to_store_id", toStoreId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as CreateStockTransferInput | null;

  if (!body?.from_store_id || !body?.to_store_id || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Payload tidak lengkap." }, { status: 400 });
  }

  if (body.from_store_id === body.to_store_id) {
    return NextResponse.json({ error: "Store asal dan tujuan tidak boleh sama." }, { status: 400 });
  }

  const canAccessFromStore = await hasStoreAccess(auth.session.userId, body.from_store_id, ["admin", "owner"]);
  const canAccessToStore = await hasStoreAccess(auth.session.userId, body.to_store_id, ["admin", "owner"]);
  if (!canAccessFromStore || !canAccessToStore) {
    return NextResponse.json({ error: "Akses ditolak ke salah satu store." }, { status: 403 });
  }

  const supabase = createServiceClient();
  const transferNo = buildTransferNo();

  const { data: transfer, error: insertError } = await supabase
    .from("stock_transfers")
    .insert({
      transfer_no: transferNo,
      from_store_id: body.from_store_id,
      to_store_id: body.to_store_id,
      status: "draft",
      note: body.note?.trim() || null,
      created_by: auth.session.userId,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  const itemsPayload = body.items.map((item) => ({
    transfer_id: transfer.id,
    product_id: item.product_id,
    qty: Number(item.qty),
  }));

  const { error: itemsError } = await supabase.from("stock_transfer_items").insert(itemsPayload);
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 400 });
  }

  return NextResponse.json({ data: transfer });
}
