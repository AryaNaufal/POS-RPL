import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

function normalizeCategoryCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { categoryId } = await context.params;
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId tidak valid" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        code?: string | null;
        name?: string;
        parentId?: string | null;
        isActive?: boolean;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.code === "string") payload.code = body.code.trim() ? normalizeCategoryCode(body.code) : null;
  if (typeof body.name === "string" && body.name.trim()) payload.name = body.name.trim();
  if (typeof body.parentId === "string") payload.parent_id = body.parentId.trim() || null;
  if (typeof body.isActive === "boolean") payload.is_active = body.isActive;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: beforeData, error: beforeError } = await supabase
    .from("product_categories")
    .select("id, parent_id, code, name, is_active")
    .eq("id", categoryId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeData) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("product_categories")
    .update(payload)
    .eq("id", categoryId)
    .select("id, parent_id, code, name, is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "product_category.update",
    entityType: "product_categories",
    entityId: data.id,
    beforeData,
    afterData: data,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ categoryId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { categoryId } = await context.params;
  if (!categoryId) {
    return NextResponse.json({ error: "categoryId tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: beforeData, error: beforeError } = await supabase
    .from("product_categories")
    .select("id, parent_id, code, name, is_active")
    .eq("id", categoryId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeData) {
    return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("product_categories")
    .update({ is_active: false })
    .eq("id", categoryId)
    .select("id, parent_id, code, name, is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "product_category.deactivate",
    entityType: "product_categories",
    entityId: data.id,
    beforeData,
    afterData: data,
  });

  return NextResponse.json({ data });
}

