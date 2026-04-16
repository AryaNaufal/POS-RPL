import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

function normalizeCustomerCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-");
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { customerId } = await context.params;
  if (!customerId) {
    return NextResponse.json({ error: "customerId tidak valid" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        code?: string | null;
        name?: string;
        phone?: string | null;
        email?: string | null;
        address?: string | null;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.code === "string") payload.code = body.code.trim() ? normalizeCustomerCode(body.code) : null;
  if (typeof body.name === "string" && body.name.trim()) payload.name = body.name.trim();
  if (typeof body.phone === "string") payload.phone = body.phone.trim() || null;
  if (typeof body.email === "string") {
    const normalizedEmail = normalizeEmail(body.email);
    if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: "Format email customer tidak valid" }, { status: 400 });
    }
    payload.email = normalizedEmail;
  }
  if (typeof body.address === "string") payload.address = body.address.trim() || null;

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: beforeData, error: beforeError } = await supabase
    .from("customers")
    .select("id, code, name, phone, email, address")
    .eq("id", customerId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeData) {
    return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("customers")
    .update(payload)
    .eq("id", customerId)
    .select("id, code, name, phone, email, address")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "customer.update",
    entityType: "customers",
    entityId: data.id,
    beforeData,
    afterData: data,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { customerId } = await context.params;
  if (!customerId) {
    return NextResponse.json({ error: "customerId tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: beforeData, error: beforeError } = await supabase
    .from("customers")
    .select("id, code, name, phone, email, address")
    .eq("id", customerId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeData) {
    return NextResponse.json({ error: "Customer tidak ditemukan" }, { status: 404 });
  }

  const { error } = await supabase.from("customers").delete().eq("id", customerId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "customer.delete",
    entityType: "customers",
    entityId: beforeData.id,
    beforeData,
  });

  return NextResponse.json({ data: { id: beforeData.id } });
}

