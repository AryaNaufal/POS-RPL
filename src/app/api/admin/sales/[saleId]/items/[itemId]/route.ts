import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { updateSaleTotals } from "@/lib/sales/totals";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ saleId: string; itemId: string }> }
) {
  const { saleId, itemId } = await params;
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
    return NextResponse.json({ error: "Hanya transaksi draft yang dapat diubah." }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("sale_items")
    .delete()
    .eq("id", itemId)
    .eq("sale_id", saleId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  await updateSaleTotals(supabase, saleId);

  return NextResponse.json({ message: "Item berhasil dihapus" });
}
