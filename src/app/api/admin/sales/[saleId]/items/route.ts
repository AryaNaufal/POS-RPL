import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { updateSaleTotals } from "@/lib/sales/totals";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    productId: string;
    qty: number;
  } | null;

  if (!body?.productId || !body?.qty || body.qty <= 0) {
    return NextResponse.json({ error: "Data item tidak valid" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Hanya transaksi draft yang dapat diubah." }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, sku, sell_price")
    .eq("id", body.productId)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  const qty = Number(body.qty);
  const unitPrice = Number(product.sell_price);
  const subtotal = qty * unitPrice;
  const total = subtotal; // Simpler for now

  const { error: itemError } = await supabase
    .from("sale_items")
    .insert({
      sale_id: saleId,
      product_id: product.id,
      product_name: product.name,
      sku_snapshot: product.sku,
      qty,
      unit_price: unitPrice,
      subtotal,
      total,
    });

  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 });

  await updateSaleTotals(supabase, saleId);

  return NextResponse.json({ message: "Item berhasil ditambahkan" });
}
