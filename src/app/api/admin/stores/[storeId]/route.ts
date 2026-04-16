import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

function normalizeStoreCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { storeId } = await context.params;
  if (!storeId) {
    return NextResponse.json({ error: "storeId tidak valid" }, { status: 400 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, storeId, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        code?: string;
        name?: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        isActive?: boolean;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.code === "string" && body.code.trim()) payload.code = normalizeStoreCode(body.code);
  if (typeof body.name === "string" && body.name.trim()) payload.name = body.name.trim();
  if (typeof body.phone === "string") payload.phone = body.phone.trim() || null;
  if (typeof body.email === "string") {
    const normalizedEmail = normalizeEmail(body.email);
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Format email toko tidak valid" }, { status: 400 });
    }
    payload.email = normalizedEmail;
  }
  if (typeof body.address === "string") payload.address = body.address.trim() || null;
  if (typeof body.isActive === "boolean") payload.is_active = body.isActive;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: beforeStore, error: beforeError } = await supabase
    .from("stores")
    .select("id, code, name, phone, email, address, is_active")
    .eq("id", storeId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeStore) {
    return NextResponse.json({ error: "Store tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("stores")
    .update(payload)
    .eq("id", storeId)
    .select("id, code, name, phone, email, address, is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "store.update",
    entityType: "stores",
    entityId: data.id,
    beforeData: beforeStore,
    afterData: data,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ storeId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { storeId } = await context.params;
  if (!storeId) {
    return NextResponse.json({ error: "storeId tidak valid" }, { status: 400 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, storeId, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: beforeStore, error: beforeError } = await supabase
    .from("stores")
    .select("id, code, name, is_active")
    .eq("id", storeId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeStore) {
    return NextResponse.json({ error: "Store tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("stores")
    .update({ is_active: false })
    .eq("id", storeId)
    .select("id, code, name, is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "store.deactivate",
    entityType: "stores",
    entityId: data.id,
    beforeData: beforeStore,
    afterData: data,
  });

  return NextResponse.json({ data });
}

