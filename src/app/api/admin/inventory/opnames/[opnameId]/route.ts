import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ opnameId: string }> }
) {
  const { opnameId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data: opname, error } = await supabase
    .from("stock_opnames")
    .select("*, stores(id, name), created_by_user:created_by(id, name), stock_opname_items(*, products(id, name, sku))")
    .eq("id", opnameId)
    .single();

  if (error || !opname) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const canAccessStore = await hasStoreAccess(auth.session.userId, opname.store_id, ["admin", "owner"]);
  if (!canAccessStore) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  return NextResponse.json({ data: opname });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ opnameId: string }> }
) {
  const { opnameId } = await params;
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    status?: "completed" | "cancelled";
  } | null;

  if (!body?.status) return NextResponse.json({ error: "Status wajib diisi." }, { status: 400 });

  const supabase = createServiceClient();
  const { data: opname, error: fetchError } = await supabase
    .from("stock_opnames")
    .select("*, stock_opname_items(*)")
    .eq("id", opnameId)
    .single();

  if (fetchError || !opname) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

  const canAccessStore = await hasStoreAccess(auth.session.userId, opname.store_id, ["admin", "owner"]);
  if (!canAccessStore) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  if (opname.status !== "draft") return NextResponse.json({ error: "Hanya draft yang bisa diubah." }, { status: 400 });

  const updateData: any = { status: body.status };
  if (body.status === "completed") updateData.completed_at = new Date().toISOString();

  const { data: updatedOpname, error: updateError } = await supabase
    .from("stock_opnames")
    .update(updateData)
    .eq("id", opnameId)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  if (body.status === "completed") {
    for (const item of opname.stock_opname_items) {
      if (item.adjustment_qty === 0) continue;

      // Update stock
      const { data: stock } = await supabase.from("product_stocks").select("qty_on_hand").eq("product_id", item.product_id).eq("store_id", opname.store_id).single();
      const currentQty = stock?.qty_on_hand ? Number(stock.qty_on_hand) : 0;
      const newQty = currentQty + Number(item.adjustment_qty);

      await supabase.from("product_stocks").upsert({ product_id: item.product_id, store_id: opname.store_id, qty_on_hand: newQty }, { onConflict: "product_id,store_id" });
      
      await supabase.from("stock_movements").insert({
        product_id: item.product_id,
        store_id: opname.store_id,
        movement_type: item.adjustment_qty > 0 ? "adjustment_in" : "adjustment_out",
        qty: Math.abs(Number(item.adjustment_qty)),
        reference_type: "stock_opnames",
        reference_id: opname.id,
        note: `STOCK OPNAME ${opname.opname_no}`,
        created_by: auth.session.userId,
      });
    }
  }

  return NextResponse.json({ data: updatedOpname });
}
