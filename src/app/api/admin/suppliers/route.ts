import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

function normalizeSupplierCode(value: string) {
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

  const supabase = createServiceClient();
  let query = supabase
    .from("suppliers")
    .select("id, code, name, phone, email, address, contact_person, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (keyword) {
    query = query.or(
      `name.ilike.%${keyword}%,code.ilike.%${keyword}%,phone.ilike.%${keyword}%,contact_person.ilike.%${keyword}%`
    );
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
        phone?: string | null;
        email?: string | null;
        address?: string | null;
        contactPerson?: string | null;
      }
    | null;

  if (!body?.name) {
    return NextResponse.json({ error: "Nama supplier wajib diisi" }, { status: 400 });
  }

  const code = String(body.code ?? "").trim() ? normalizeSupplierCode(String(body.code)) : null;
  const name = body.name.trim();
  const phone = String(body.phone ?? "").trim() || null;
  const email = normalizeEmail(body.email);
  const address = String(body.address ?? "").trim() || null;
  const contactPerson = String(body.contactPerson ?? "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Nama supplier tidak valid" }, { status: 400 });
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Format email supplier tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      code,
      name,
      phone,
      email,
      address,
      contact_person: contactPerson,
    })
    .select("id, code, name, phone, email, address, contact_person")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "supplier.create",
    entityType: "suppliers",
    entityId: data.id,
    afterData: data,
  });

  return NextResponse.json({ data });
}


