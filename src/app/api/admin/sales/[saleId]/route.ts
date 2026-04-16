import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data: sale, error } = await supabase
    .from("sales")
    .select(
      "*, stores(id, name), customers(id, name), cashier:cashier_id(id, name, email), sale_items(*), sale_payments(*)"
    )
    .eq("id", saleId)
    .single();

  if (error || !sale) {
    return NextResponse.json({ error: "Data transaksi tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, sale.store_id, ["admin", "owner"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  return NextResponse.json({ data: sale });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    status?: "completed" | "void" | "refunded";
    note?: string | null;
  } | null;

  const supabase = createServiceClient();
  const { data: sale, error: fetchError } = await supabase
    .from("sales")
    .select("store_id, status")
    .eq("id", saleId)
    .single();

  if (fetchError || !sale) {
    return NextResponse.json({ error: "Data transaksi tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, sale.store_id, ["admin", "owner"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  if (sale.status === "void" || sale.status === "refunded") {
    return NextResponse.json({ error: "Status transaksi sudah final tidak dapat diubah." }, { status: 400 });
  }

  const updateData: any = {};
  if (body?.note !== undefined) updateData.note = body.note;
  if (body?.status !== undefined) updateData.status = body.status;

  const { data: updatedSale, error: updateError } = await supabase
    .from("sales")
    .update(updateData)
    .eq("id", saleId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "sale.update",
    entityType: "sales",
    entityId: saleId,
    beforeData: sale,
    afterData: updatedSale,
  });

  // If status changed to 'void' or 'refunded', we need to restore stocks
  if (body?.status === "void" || body?.status === "refunded") {
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("product_id, qty")
      .eq("sale_id", saleId);

    if (itemsError) {
      console.error("Failed to fetch sale items for stock restoration:", itemsError);
    } else if (items) {
      for (const item of items) {
        if (!item.product_id) continue;

        // Restore stock
        const { data: stock, error: stockFetchError } = await supabase
          .from("product_stocks")
          .select("qty_on_hand")
          .eq("product_id", item.product_id)
          .eq("store_id", sale.store_id)
          .single();

        if (!stockFetchError && stock) {
          const newQty = Number(stock.qty_on_hand) + Number(item.qty);
          await supabase
            .from("product_stocks")
            .update({ qty_on_hand: newQty })
            .eq("product_id", item.product_id)
            .eq("store_id", sale.store_id);
            
          // Record movement
          await supabase.from("stock_movements").insert({
            product_id: item.product_id,
            store_id: sale.store_id,
            movement_type: body.status === "void" ? "adjustment_in" : "sale_return", // Using adjustment_in for void or sale_return for refund
            qty: Number(item.qty),
            reference_type: "sale",
            reference_id: saleId,
            note: `${body.status.toUpperCase()} Transaksi ${updatedSale.invoice_no}`,
            created_by: auth.session.userId,
          });
        }
      }
    }
  }

  return NextResponse.json({ data: updatedSale });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data: sale, error: fetchError } = await supabase
    .from("sales")
    .select("store_id, status")
    .eq("id", saleId)
    .single();

  if (fetchError || !sale) {
    return NextResponse.json({ error: "Data transaksi tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, sale.store_id, ["admin", "owner"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  if (sale.status !== "draft") {
    return NextResponse.json({ error: "Hanya transaksi draft yang dapat dihapus." }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("sales")
    .delete()
    .eq("id", saleId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "sale.delete",
    entityType: "sales",
    entityId: saleId,
    beforeData: sale,
  });

  return NextResponse.json({ message: "Transaksi draft berhasil dihapus" });
}
