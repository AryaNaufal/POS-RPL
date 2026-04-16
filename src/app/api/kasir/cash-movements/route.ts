import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request-session";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";
import type { CreateCashMovementInput } from "@/types/forms/cash-movement-form";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const shiftId = searchParams.get("shiftId");

  if (!storeId) return NextResponse.json({ error: "storeId wajib diisi." }, { status: 400 });

  const supabase = createServiceClient();
  let query = supabase
    .from("cash_movements")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (shiftId) query = query.eq("shift_id", shiftId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as CreateCashMovementInput | null;

  if (!body?.store_id || !body?.movement_type || !body?.amount || !body?.reason) {
    return NextResponse.json({ error: "Payload tidak lengkap." }, { status: 400 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, body.store_id, ["kasir", "admin", "owner"]);
  if (!canAccessStore) return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });

  const supabase = createServiceClient();
  
  // Find active shift if not provided
  let shiftId = body.shift_id;
  if (!shiftId) {
    const { data: shift } = await supabase
        .from("cashier_shifts")
        .select("id")
        .eq("store_id", body.store_id)
        .eq("cashier_id", auth.session.userId)
        .eq("status", "open")
        .maybeSingle();
    shiftId = shift?.id ?? null;
  }

  const { data: movement, error: insertError } = await supabase
    .from("cash_movements")
    .insert({
      store_id: body.store_id,
      shift_id: shiftId,
      movement_type: body.movement_type,
      amount: Number(body.amount),
      reason: body.reason.trim(),
      reference_type: body.reference_type || null,
      reference_id: body.reference_id || null,
      created_by: auth.session.userId,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ data: movement });
}
