import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as
    | {
        productId?: string;
        storeId?: string;
        type?: "adjustment_in" | "adjustment_out";
        qty?: number;
        note?: string;
      }
    | null;

  if (!body?.productId || !body?.storeId || !body?.type || typeof body.qty !== "number") {
    return NextResponse.json({ error: "Payload adjustment tidak valid" }, { status: 400 });
  }

  if (!["adjustment_in", "adjustment_out"].includes(body.type) || body.qty <= 0) {
    return NextResponse.json({ error: "Tipe/qty adjustment tidak valid" }, { status: 400 });
  }
  const canAccessStore = await hasStoreAccess(auth.session.userId, body.storeId, ["admin", "owner"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const delta = body.type === "adjustment_in" ? body.qty : -body.qty;

  const supabase = createServiceClient();
  const { data: currentStock, error: stockError } = await supabase
    .from("product_stocks")
    .select("id, qty_on_hand")
    .eq("product_id", body.productId)
    .eq("store_id", body.storeId)
    .maybeSingle();

  if (stockError) {
    return NextResponse.json({ error: stockError.message }, { status: 400 });
  }

  const currentQty = Number(currentStock?.qty_on_hand ?? 0);
  const nextQty = currentQty + delta;
  if (nextQty < 0) {
    return NextResponse.json({ error: "Stok tidak mencukupi untuk adjustment keluar" }, { status: 400 });
  }

  const upsertPayload = {
    product_id: body.productId,
    store_id: body.storeId,
    qty_on_hand: nextQty,
  };

  const { error: upsertError } = await supabase
    .from("product_stocks")
    .upsert(upsertPayload, { onConflict: "product_id,store_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  const { data: movement, error: movementError } = await supabase
    .from("stock_movements")
    .insert({
      product_id: body.productId,
      store_id: body.storeId,
      movement_type: body.type,
      qty: body.qty,
      note: body.note?.trim() || null,
      created_by: auth.session.userId,
      reference_type: "manual_adjustment",
    })
    .select("id")
    .single();

  if (movementError) {
    return NextResponse.json({ error: movementError.message }, { status: 400 });
  }
  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "stock.adjustment.create",
    entityType: "stock_movements",
    entityId: movement.id,
    beforeData: {
      productId: body.productId,
      storeId: body.storeId,
      qtyOnHand: currentQty,
    },
    afterData: {
      movementType: body.type,
      movementQty: body.qty,
      qtyOnHand: nextQty,
      note: body.note?.trim() || null,
    },
  });

  return NextResponse.json({
    data: {
      movementId: movement.id,
      previousQty: currentQty,
      nextQty,
    },
  });
}
