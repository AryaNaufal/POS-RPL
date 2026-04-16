import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request-session";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");

  if (!storeId) {
    return NextResponse.json({ error: "storeId wajib diisi." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: shift, error } = await supabase
    .from("cashier_shifts")
    .select("*")
    .eq("store_id", storeId)
    .eq("cashier_id", auth.session.userId)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ data: shift });
}
