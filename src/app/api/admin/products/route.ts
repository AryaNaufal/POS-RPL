import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

const PLACEHOLDER_IMAGE_URL = "https://placehold.co/600x400";

function normalizeSku(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim();

  const supabase = createServiceClient();
  let query = supabase
    .from("products")
    .select(
      "id, sku, name, image_url, sell_price, buy_price, min_stock, is_active, category_id, unit_id, product_categories(name), product_units(name, symbol)"
    )
    .order("created_at", { ascending: false });

  if (keyword) {
    query = query.or(`name.ilike.%${keyword}%,sku.ilike.%${keyword}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

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
      }
    | null;

  if (!body?.sku || !body?.name) {
    return NextResponse.json({ error: "SKU dan nama produk wajib diisi" }, { status: 400 });
  }

  const buyPrice = Number(body.buyPrice ?? 0);
  const sellPrice = Number(body.sellPrice ?? 0);
  const minStock = Number(body.minStock ?? 0);

  if (buyPrice < 0 || sellPrice < 0 || minStock < 0) {
    return NextResponse.json({ error: "Nilai harga/stok tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      sku: normalizeSku(body.sku),
      name: body.name.trim(),
      category_id: body.categoryId || null,
      unit_id: body.unitId || null,
      buy_price: buyPrice,
      sell_price: sellPrice,
      min_stock: minStock,
      track_stock: body.trackStock ?? true,
      image_url: body.imageUrl?.trim() || PLACEHOLDER_IMAGE_URL,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "product.create",
    entityType: "products",
    entityId: data.id,
    afterData: {
      sku: normalizeSku(body.sku),
      name: body.name.trim(),
      categoryId: body.categoryId || null,
      unitId: body.unitId || null,
      buyPrice,
      sellPrice,
      minStock,
      trackStock: body.trackStock ?? true,
      imageUrl: body.imageUrl?.trim() || PLACEHOLDER_IMAGE_URL,
      isActive: true,
    },
  });

  return NextResponse.json({ data });
}

