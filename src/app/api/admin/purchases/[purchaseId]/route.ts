import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  const { purchaseId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data: purchase, error } = await supabase
    .from("purchases")
    .select(
      "*, stores(id, code, name), suppliers(id, code, name), users(id, name, email), purchase_items(*)"
    )
    .eq("id", purchaseId)
    .single();

  if (error || !purchase) {
    return NextResponse.json({ error: "Data pembelian tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, purchase.store_id, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  return NextResponse.json({ data: purchase });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  const { purchaseId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    supplierId?: string | null;
    status?: "draft" | "received";
    note?: string | null;
  } | null;

  const supabase = createServiceClient();
  const { data: purchase, error: fetchError } = await supabase
    .from("purchases")
    .select("store_id, status")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) {
    return NextResponse.json({ error: "Data pembelian tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, purchase.store_id, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  if (purchase.status === "received" && body?.status !== undefined) {
    return NextResponse.json({ error: "Pembelian yang sudah received tidak dapat diubah statusnya." }, { status: 400 });
  }

  const updateData: { supplier_id?: string | null; note?: string | null; status?: "draft" | "received"; received_at?: string } = {};
  if (body?.supplierId !== undefined) updateData.supplier_id = body.supplierId;
  if (body?.note !== undefined) updateData.note = body.note;
  if (body?.status !== undefined) {
    if (body.status !== "draft" && body.status !== "received") {
      return NextResponse.json({ error: "Status pembelian tidak valid untuk scope MVP." }, { status: 400 });
    }
    updateData.status = body.status;
    if (body.status === "received") updateData.received_at = new Date().toISOString();
  }

  const { data: updatedPurchase, error: updateError } = await supabase
    .from("purchases")
    .update(updateData)
    .eq("id", purchaseId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "purchase.update",
    entityType: "purchases",
    entityId: purchaseId,
    beforeData: purchase,
    afterData: updatedPurchase,
  });

  // If status changed to 'received' from draft, update stocks once.
  if (purchase.status === "draft" && body?.status === "received") {
    const { data: items, error: itemsError } = await supabase
      .from("purchase_items")
      .select("product_id, qty, unit_cost")
      .eq("purchase_id", purchaseId);

    if (itemsError) {
      console.error("Failed to fetch purchase items for stock update:", itemsError);
    } else if (items) {
      for (const item of items) {
        if (!item.product_id) continue;

        // 1. Update or Insert product_stocks
        const { data: stock, error: stockFetchError } = await supabase
          .from("product_stocks")
          .select("qty_on_hand")
          .eq("product_id", item.product_id)
          .eq("store_id", purchase.store_id)
          .single();

        if (stockFetchError && stockFetchError.code !== "PGRST116") {
          console.error(`Failed to fetch stock for product ${item.product_id}:`, stockFetchError);
          continue;
        }

        const currentQty = stock?.qty_on_hand ? Number(stock.qty_on_hand) : 0;
        const newQty = currentQty + Number(item.qty);

        if (!stock) {
          await supabase.from("product_stocks").insert({
            product_id: item.product_id,
            store_id: purchase.store_id,
            qty_on_hand: newQty,
          });
        } else {
          await supabase
            .from("product_stocks")
            .update({ qty_on_hand: newQty })
            .eq("product_id", item.product_id)
            .eq("store_id", purchase.store_id);
        }

        // 2. Insert stock_movements
        await supabase.from("stock_movements").insert({
          product_id: item.product_id,
          store_id: purchase.store_id,
          movement_type: "purchase",
          qty: Number(item.qty),
          unit_cost: Number(item.unit_cost),
          reference_type: "purchases",
          reference_id: purchaseId,
          created_by: auth.session.userId,
        });
      }
    }
  }

  return NextResponse.json({ data: updatedPurchase });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  const { purchaseId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data: purchase, error: fetchError } = await supabase
    .from("purchases")
    .select("store_id, status")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) {
    return NextResponse.json({ error: "Data pembelian tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, purchase.store_id, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  if (purchase.status !== "draft") {
    return NextResponse.json({ error: "Hanya pembelian draft yang dapat dihapus." }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("purchases")
    .delete()
    .eq("id", purchaseId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "purchase.delete",
    entityType: "purchases",
    entityId: purchaseId,
    beforeData: purchase,
  });

  return NextResponse.json({ message: "Pembelian berhasil dihapus" });
}
