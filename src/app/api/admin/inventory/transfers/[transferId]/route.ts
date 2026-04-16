import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ transferId: string }> }
) {
  const { transferId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data: transfer, error } = await supabase
    .from("stock_transfers")
    .select("*, from_store:from_store_id(id, name), to_store:to_store_id(id, name), created_by_user:created_by(id, name), stock_transfer_items(*, products(id, name, sku))")
    .eq("id", transferId)
    .single();

  if (error || !transfer) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const canAccessFrom = await hasStoreAccess(auth.session.userId, transfer.from_store_id, ["admin", "owner"]);
  const canAccessTo = await hasStoreAccess(auth.session.userId, transfer.to_store_id, ["admin", "owner"]);
  if (!canAccessFrom || !canAccessTo) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  return NextResponse.json({ data: transfer });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ transferId: string }> }
) {
  const { transferId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    status?: "shipped" | "received" | "cancelled";
  } | null;

  if (!body?.status) return NextResponse.json({ error: "Status wajib diisi." }, { status: 400 });

  const supabase = createServiceClient();
  const { data: transfer, error: fetchError } = await supabase
    .from("stock_transfers")
    .select("*, stock_transfer_items(*)")
    .eq("id", transferId)
    .single();

  if (fetchError || !transfer) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const canAccessFrom = await hasStoreAccess(auth.session.userId, transfer.from_store_id, ["admin", "owner"]);
  const canAccessTo = await hasStoreAccess(auth.session.userId, transfer.to_store_id, ["admin", "owner"]);
  if (!canAccessFrom || !canAccessTo) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  // Status flow validation
  if (transfer.status === "received" || transfer.status === "cancelled") {
    return NextResponse.json({ error: "Status sudah final." }, { status: 400 });
  }

  if (body.status === "shipped" && transfer.status !== "draft") {
    return NextResponse.json({ error: "Hanya draft yang bisa dikirim." }, { status: 400 });
  }

  if (body.status === "received" && transfer.status !== "shipped") {
    return NextResponse.json({ error: "Barang harus dikirim sebelum diterima." }, { status: 400 });
  }

  const updateData: any = { status: body.status };
  if (body.status === "shipped") updateData.shipped_at = new Date().toISOString();
  if (body.status === "received") updateData.received_at = new Date().toISOString();

  const { data: updatedTransfer, error: updateError } = await supabase
    .from("stock_transfers")
    .update(updateData)
    .eq("id", transferId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  // Handle stock updates
  if (body.status === "shipped") {
    for (const item of transfer.stock_transfer_items) {
      // Decrease from source store
      const { data: stock } = await supabase.from("product_stocks").select("qty_on_hand").eq("product_id", item.product_id).eq("store_id", transfer.from_store_id).single();
      const currentQty = stock?.qty_on_hand ? Number(stock.qty_on_hand) : 0;
      await supabase.from("product_stocks").upsert({ product_id: item.product_id, store_id: transfer.from_store_id, qty_on_hand: currentQty - Number(item.qty) }, { onConflict: "product_id,store_id" });
      
      await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        store_id: transfer.from_store_id,
        movement_type: "transfer_out",
        qty: Number(item.qty),
        reference_type: "stock_transfers",
        reference_id: transfer.id,
        created_by: auth.session.userId,
      });
    }
  } else if (body.status === "received") {
    for (const item of transfer.stock_transfer_items) {
      // Increase at destination store
      const { data: stock } = await supabase.from("product_stocks").select("qty_on_hand").eq("product_id", item.product_id).eq("store_id", transfer.to_store_id).single();
      const currentQty = stock?.qty_on_hand ? Number(stock.qty_on_hand) : 0;
      await supabase.from("product_stocks").upsert({ product_id: item.product_id, store_id: transfer.to_store_id, qty_on_hand: currentQty + Number(item.qty) }, { onConflict: "product_id,store_id" });
      
      await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        store_id: transfer.to_store_id,
        movement_type: "transfer_in",
        qty: Number(item.qty),
        reference_type: "stock_transfers",
        reference_id: transfer.id,
        created_by: auth.session.userId,
      });
    }
  }

  return NextResponse.json({ data: updatedTransfer });
}
