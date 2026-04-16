import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

function normalizeCategoryCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim();
  const isActive = searchParams.get("isActive");

  const supabase = createServiceClient();
  let query = supabase
    .from("product_categories")
    .select("id, parent_id, code, name, is_active, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (keyword) {
    query = query.or(`name.ilike.%${keyword}%,code.ilike.%${keyword}%`);
  }
  if (isActive === "true") {
    query = query.eq("is_active", true);
  } else if (isActive === "false") {
    query = query.eq("is_active", false);
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
        code?: string | null;
        name?: string;
        parentId?: string | null;
      }
    | null;

  if (!body?.name) {
    return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
  }

  const code = String(body.code ?? "").trim() ? normalizeCategoryCode(String(body.code)) : null;
  const name = body.name.trim();
  const parentId = String(body.parentId ?? "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Nama kategori tidak valid" }, { status: 400 });
  }

  if (parentId && parentId === "0") {
    return NextResponse.json({ error: "Parent kategori tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_categories")
    .insert({
      code,
      name,
      parent_id: parentId,
      is_active: true,
    })
    .select("id, parent_id, code, name, is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "product_category.create",
    entityType: "product_categories",
    entityId: data.id,
    afterData: data,
  });

  return NextResponse.json({ data });
}

