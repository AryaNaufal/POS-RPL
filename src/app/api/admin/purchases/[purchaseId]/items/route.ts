import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { updatePurchaseTotals } from "@/lib/purchases/totals";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  const { purchaseId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    productId?: string;
    productName?: string;
    qty?: number;
    unitCost?: number;
    discountAmount?: number;
    taxAmount?: number;
  } | null;

  if (!body?.productName || !body?.qty || body.qty <= 0) {
    return NextResponse.json({ error: "Data item tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: purchase, error: fetchError } = await supabase
    .from("purchases")
    .select("store_id, status")
    .eq("id", purchaseId)
    .single();

  if (fetchError || !purchase) {
    return NextResponse.json({ error: "Data pembelian tidak ditemukan" }, { status: 404 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, purchase.store_id, ["admin", "owner"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  if (purchase.status !== "draft") {
    return NextResponse.json({ error: "Hanya pembelian draft yang dapat diubah." }, { status: 400 });
  }

  const qty = Number(body.qty);
  const unitCost = Number(body.unitCost ?? 0);
  const discountAmount = Number(body.discountAmount ?? 0);
  const taxAmount = Number(body.taxAmount ?? 0);
  const total = (qty * unitCost) - discountAmount + taxAmount;

  const { data: item, error: itemError } = await supabase
    .from("purchase_items")
    .insert({
      purchase_id: purchaseId,
      product_id: body.productId || null,
      product_name: body.productName,
      qty,
      unit_cost: unitCost,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total,
    })
    .select()
    .single();

  if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 });

  // Update purchase totals
  await updatePurchaseTotals(supabase, purchaseId);

  return NextResponse.json({ data: item });
}
