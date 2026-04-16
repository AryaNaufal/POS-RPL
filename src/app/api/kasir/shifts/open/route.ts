import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request-session";
import { createServiceClient } from "@/lib/supabase/service";
import { hasStoreAccess } from "@/lib/auth/store-scope";

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    storeId?: string;
    openingCash?: number;
    note?: string;
  } | null;

  if (!body?.storeId) {
    return NextResponse.json({ error: "storeId wajib diisi." }, { status: 400 });
  }

  const canAccessStore = await hasStoreAccess(auth.session.userId, body.storeId, ["kasir", "admin", "owner"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const supabase = createServiceClient();
  
  // Check if there is already an open shift for this cashier and store
  const { data: existingShift } = await supabase
    .from("cashier_shifts")
    .select("id")
    .eq("store_id", body.storeId)
    .eq("cashier_id", auth.session.userId)
    .eq("status", "open")
    .maybeSingle();

  if (existingShift) {
    return NextResponse.json({ error: "Masih ada shift yang belum ditutup." }, { status: 400 });
  }

  const { data: newShift, error: insertError } = await supabase
    .from("cashier_shifts")
    .insert({
      store_id: body.storeId,
      cashier_id: auth.session.userId,
      opened_at: new Date().toISOString(),
      opening_cash: Number(body.openingCash ?? 0),
      status: "open",
      note: body.note?.trim() || null,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });

  return NextResponse.json({ data: newShift });
}
