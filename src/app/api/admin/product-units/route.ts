import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

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
    .from("product_units")
    .select("id, name, symbol, created_at")
    .order("created_at", { ascending: false });

  if (keyword) {
    query = query.or(`name.ilike.%${keyword}%,symbol.ilike.%${keyword}%`);
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
        name?: string;
        symbol?: string;
      }
    | null;

  if (!body?.name || !body?.symbol) {
    return NextResponse.json({ error: "Nama dan simbol satuan wajib diisi" }, { status: 400 });
  }

  const name = body.name.trim();
  const symbol = body.symbol.trim().toUpperCase();
  if (!name || !symbol) {
    return NextResponse.json({ error: "Nama dan simbol satuan tidak valid" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_units")
    .insert({
      name,
      symbol,
    })
    .select("id, name, symbol")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "product_unit.create",
    entityType: "product_units",
    entityId: data.id,
    afterData: data,
  });

  return NextResponse.json({ data });
}


