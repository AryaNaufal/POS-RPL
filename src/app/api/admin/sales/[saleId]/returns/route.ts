import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import type { StockReturnInput } from "@/types/forms/stock-return-form";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as StockReturnInput | null;

  if (!body?.item_id || !body?.qty || body.qty <= 0) {
    return NextResponse.json({ error: "Data retur tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  
  // 1. Get sale and item
  const { data: sale } = await supabase.from("sales").select("store_id, status, invoice_no").eq("id", saleId).single();
  const { data: item } = await supabase.from("sale_items").select("*").eq("id", body.item_id).single();

  if (!sale || !item) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
  if (sale.status !== "completed") return NextResponse.json({ error: "Hanya transaksi selesai yang bisa diretur" }, { status: 400 });

  const remainingQty = Number(item.qty) - Number(item.return_qty);
  if (body.qty > remainingQty) return NextResponse.json({ error: "Qty retur melebihi qty sisa" }, { status: 400 });

  // 2. Update item return_qty
  const newReturnQty = Number(item.return_qty) + Number(body.qty);
  await supabase.from("sale_items").update({ return_qty: newReturnQty, return_reason: body.reason }).eq("id", item.id);

  // 3. Update stock
  const { data: stock } = await supabase.from("product_stocks").select("qty_on_hand").eq("product_id", item.product_id).eq("store_id", sale.store_id).single();
  const currentQty = stock?.qty_on_hand ? Number(stock.qty_on_hand) : 0;
  await supabase.from("product_stocks").upsert({ product_id: item.product_id, store_id: sale.store_id, qty_on_hand: currentQty + Number(body.qty) }, { onConflict: "product_id,store_id" });

  // 4. Record movement
  await supabase.from("stock_movements").insert({
    product_id: item.product_id,
    store_id: sale.store_id,
    movement_type: "sale_return",
    qty: Number(body.qty),
    reference_type: "sales",
    reference_id: saleId,
    note: `RETUR JUAL ${sale.invoice_no}: ${body.reason}`,
    created_by: auth.session.userId,
  });

  return NextResponse.json({ message: "Retur berhasil diproses" });
}
