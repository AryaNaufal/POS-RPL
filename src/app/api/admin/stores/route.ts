import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

function normalizeStoreCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
}

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword")?.trim();
  const isActive = searchParams.get("isActive");

  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin"]);
  if (storeIds.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const supabase = createServiceClient();
  let query = supabase
    .from("stores")
    .select("id, code, name, phone, email, address, is_active, created_at, updated_at")
    .in("id", storeIds)
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
        code?: string;
        name?: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
      }
    | null;

  if (!body?.code || !body?.name) {
    return NextResponse.json({ error: "Code dan nama toko wajib diisi" }, { status: 400 });
  }

  const code = normalizeStoreCode(body.code);
  const name = body.name.trim();
  const phone = String(body.phone ?? "").trim() || null;
  const email = normalizeEmail(body.email);
  const address = String(body.address ?? "").trim() || null;

  if (!code || !name) {
    return NextResponse.json({ error: "Code dan nama toko tidak valid" }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format email toko tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: createdStore, error: createStoreError } = await supabase
    .from("stores")
    .insert({
      code,
      name,
      phone,
      email,
      address,
      is_active: true,
    })
    .select("id, code, name, phone, email, address, is_active")
    .single();

  if (createStoreError || !createdStore) {
    return NextResponse.json({ error: createStoreError?.message ?? "Gagal membuat toko" }, { status: 400 });
  }

  const roleCodeForCreator = "admin";

  const { data: creatorRole, error: roleError } = await supabase
    .from("roles")
    .select("id")
    .eq("code", roleCodeForCreator)
    .single();

  if (roleError || !creatorRole) {
    await supabase.from("stores").delete().eq("id", createdStore.id);
    return NextResponse.json({ error: "Role default untuk creator tidak ditemukan" }, { status: 400 });
  }

  const { error: assignError } = await supabase.from("user_store_roles").insert({
    user_id: auth.session.userId,
    store_id: createdStore.id,
    role_id: creatorRole.id,
    is_active: true,
  });

  if (assignError) {
    await supabase.from("stores").delete().eq("id", createdStore.id);
    return NextResponse.json(
      { error: "Gagal assign creator ke store baru. Pembuatan toko dibatalkan." },
      { status: 400 }
    );
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "store.create",
    entityType: "stores",
    entityId: createdStore.id,
    afterData: createdStore,
  });

  return NextResponse.json({ data: createdStore });
}

