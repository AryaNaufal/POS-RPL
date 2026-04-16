import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ unitId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { unitId } = await context.params;
  if (!unitId) {
    return NextResponse.json({ error: "unitId tidak valid" }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        name?: string;
        symbol?: string;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) payload.name = body.name.trim();
  if (typeof body.symbol === "string" && body.symbol.trim()) payload.symbol = body.symbol.trim().toUpperCase();

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Tidak ada data untuk diupdate" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: beforeData, error: beforeError } = await supabase
    .from("product_units")
    .select("id, name, symbol")
    .eq("id", unitId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeData) {
    return NextResponse.json({ error: "Satuan tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("product_units")
    .update(payload)
    .eq("id", unitId)
    .select("id, name, symbol")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "product_unit.update",
    entityType: "product_units",
    entityId: data.id,
    beforeData,
    afterData: data,
  });

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ unitId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { unitId } = await context.params;
  if (!unitId) {
    return NextResponse.json({ error: "unitId tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: beforeData, error: beforeError } = await supabase
    .from("product_units")
    .select("id, name, symbol")
    .eq("id", unitId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeData) {
    return NextResponse.json({ error: "Satuan tidak ditemukan" }, { status: 404 });
  }

  const { error } = await supabase.from("product_units").delete().eq("id", unitId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "product_unit.delete",
    entityType: "product_units",
    entityId: beforeData.id,
    beforeData,
  });

  return NextResponse.json({ data: { id: beforeData.id } });
}

