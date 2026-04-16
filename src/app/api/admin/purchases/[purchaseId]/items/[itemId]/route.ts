import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { updatePurchaseTotals } from "@/lib/purchases/totals";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string; itemId: string }> }
) {
  const { purchaseId, itemId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    qty?: number;
    unitCost?: number;
    discountAmount?: number;
    taxAmount?: number;
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

  if (purchase.status !== "draft") {
    return NextResponse.json({ error: "Hanya pembelian draft yang dapat diubah." }, { status: 400 });
  }

  const { data: item, error: itemFetchError } = await supabase
    .from("purchase_items")
    .select("*")
    .eq("id", itemId)
    .eq("purchase_id", purchaseId)
    .single();

  if (itemFetchError || !item) {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }

  const qty = Number(body?.qty ?? item.qty);
  const unitCost = Number(body?.unitCost ?? item.unit_cost);
  const discountAmount = Number(body?.discountAmount ?? item.discount_amount);
  const taxAmount = Number(body?.taxAmount ?? item.tax_amount);
  const total = (qty * unitCost) - discountAmount + taxAmount;

  const { data: updatedItem, error: updateError } = await supabase
    .from("purchase_items")
    .update({
      qty,
      unit_cost: unitCost,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await updatePurchaseTotals(supabase, purchaseId);

  return NextResponse.json({ data: updatedItem });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string; itemId: string }> }
) {
  const { purchaseId, itemId } = await params;
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
    return NextResponse.json({ error: "Hanya pembelian draft yang dapat diubah." }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from("purchase_items")
    .delete()
    .eq("id", itemId)
    .eq("purchase_id", purchaseId);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });

  await updatePurchaseTotals(supabase, purchaseId);

  return NextResponse.json({ message: "Item berhasil dihapus" });
}
