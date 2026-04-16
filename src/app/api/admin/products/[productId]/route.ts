import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { productId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | {
        sku?: string;
        name?: string;
        categoryId?: string | null;
        unitId?: string | null;
        buyPrice?: number;
        sellPrice?: number;
        minStock?: number;
        trackStock?: boolean;
        imageUrl?: string | null;
        isActive?: boolean;
      }
    | null;

  if (!productId || !body) {
    return NextResponse.json({ error: "Request tidak valid" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.sku === "string" && body.sku.trim()) payload.sku = body.sku.trim().toUpperCase().replace(/\s+/g, "-");
  if (typeof body.name === "string" && body.name.trim()) payload.name = body.name.trim();
  if (typeof body.categoryId === "string") payload.category_id = body.categoryId || null;
  if (typeof body.unitId === "string") payload.unit_id = body.unitId || null;
  if (typeof body.buyPrice === "number" && body.buyPrice >= 0) payload.buy_price = body.buyPrice;
  if (typeof body.sellPrice === "number" && body.sellPrice >= 0) payload.sell_price = body.sellPrice;
  if (typeof body.minStock === "number" && body.minStock >= 0) payload.min_stock = body.minStock;
  if (typeof body.trackStock === "boolean") payload.track_stock = body.trackStock;
  if (typeof body.imageUrl === "string") payload.image_url = body.imageUrl.trim() || null;
  if (typeof body.isActive === "boolean") payload.is_active = body.isActive;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: beforeProduct, error: beforeError } = await supabase
    .from("products")
    .select("id, sku, name, category_id, unit_id, buy_price, sell_price, min_stock, track_stock, image_url, is_active")
    .eq("id", productId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeProduct) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "product.update",
    entityType: "products",
    entityId: data.id,
    beforeData: beforeProduct,
    afterData: data,
  });

  return NextResponse.json({ data });
}
