import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/request-session";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    closingCash?: number;
    note?: string;
  } | null;

  if (body?.closingCash === undefined) {
    return NextResponse.json({ error: "closingCash wajib diisi." }, { status: 400 });
  }

  const supabase = createServiceClient();
  
  // Find the active shift
  const { data: shift, error: fetchError } = await supabase
    .from("cashier_shifts")
    .select("*")
    .eq("cashier_id", auth.session.userId)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError || !shift) {
    return NextResponse.json({ error: "Tidak ada shift aktif." }, { status: 404 });
  }

  // Calculate expected cash
  // 1. Get cash sales
  const { data: cashSales } = await supabase
    .from("sale_payments")
    .select("amount")
    .eq("payment_method", "cash")
    .in(
        "sale_id",
        supabase
            .from("sales")
            .select("id")
            .eq("shift_id", shift.id)
            .eq("status", "completed")
    );
    
  // Wait, the subquery might not work in some versions of Supabase client easily, let's join or do it separately.
  // Better: get all sales in this shift first
  const { data: sales } = await supabase
    .from("sales")
    .select("id")
    .eq("shift_id", shift.id)
    .eq("status", "completed");

  const saleIds = sales?.map(s => s.id) || [];
  let totalCashSales = 0;
  if (saleIds.length > 0) {
    const { data: payments } = await supabase
        .from("sale_payments")
        .select("amount")
        .eq("payment_method", "cash")
        .in("sale_id", saleIds);
    totalCashSales = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  }

  // 2. Get cash movements
  const { data: movements } = await supabase
    .from("cash_movements")
    .select("amount, movement_type")
    .eq("shift_id", shift.id);

  let totalCashIn = 0;
  let totalCashOut = 0;
  movements?.forEach(m => {
    if (m.movement_type === "in") totalCashIn += Number(m.amount);
    else totalCashOut += Number(m.amount);
  });

  const expectedCash = Number(shift.opening_cash) + totalCashSales + totalCashIn - totalCashOut;
  const closingCash = Number(body.closingCash);
  const cashDifference = closingCash - expectedCash;

  const { data: closedShift, error: updateError } = await supabase
    .from("cashier_shifts")
    .update({
      closed_at: new Date().toISOString(),
      closing_cash: closingCash,
      expected_cash: expectedCash,
      cash_difference: cashDifference,
      status: "closed",
      note: body.note?.trim() || shift.note,
    })
    .eq("id", shift.id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ data: closedShift });
}
