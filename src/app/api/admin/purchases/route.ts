import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds, hasStoreAccess } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

const ALLOWED_STATUSES = ["draft", "received"] as const;

function buildPurchaseNo() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PO-${y}${m}${d}-${random}`;
}

async function createPurchaseNo(supabase: ReturnType<typeof createServiceClient>) {
  for (let i = 0; i < 6; i += 1) {
    const candidate = buildPurchaseNo();
    const { count, error } = await supabase
      .from("purchases")
      .select("id", { count: "exact", head: true })
      .eq("purchase_no", candidate);
    if (!error && (count ?? 0) === 0) return candidate;
  }
  return `${buildPurchaseNo()}-${Date.now().toString().slice(-4)}`;
}

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const supplierId = searchParams.get("supplierId");
  const status = searchParams.get("status");
  const keyword = searchParams.get("keyword")?.trim();
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin"]);
  if (storeIds.length === 0) return NextResponse.json({ data: [] });

  if (storeId && !storeIds.includes(storeId)) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("purchases")
    .select(
      "id, purchase_no, store_id, supplier_id, created_by, status, subtotal, discount_total, tax_total, grand_total, note, ordered_at, received_at, created_at, stores(id, code, name), suppliers(id, code, name), users(id, name, email)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  query = storeId ? query.eq("store_id", storeId) : query.in("store_id", storeIds);
  if (supplierId) query = query.eq("supplier_id", supplierId);
  if (status && (ALLOWED_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (keyword) query = query.ilike("purchase_no", `%${keyword}%`);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | {
        storeId?: string;
        supplierId?: string | null;
        note?: string | null;
      }
    | null;

  if (!body?.storeId) {
    return NextResponse.json({ error: "storeId wajib diisi" }, { status: 400 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, body.storeId, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const supabase = createServiceClient();
  const purchaseNo = await createPurchaseNo(supabase);

  const { data, error } = await supabase
    .from("purchases")
    .insert({
      purchase_no: purchaseNo,
      store_id: body.storeId,
      supplier_id: body.supplierId || null,
      created_by: auth.session.userId,
      status: "draft",
      subtotal: 0,
      discount_total: 0,
      tax_total: 0,
      grand_total: 0,
      note: String(body.note ?? "").trim() || null,
    })
    .select("id, purchase_no, store_id, supplier_id, status, grand_total, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "purchase.create",
    entityType: "purchases",
    entityId: data.id,
    afterData: data,
  });

  return NextResponse.json({ data });
}


