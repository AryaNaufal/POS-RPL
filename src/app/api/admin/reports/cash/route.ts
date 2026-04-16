import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";
import type { CashReportRow } from "@/types/views/report";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  const dateFrom = searchParams.get("dateFrom") || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0];
  const dateTo = searchParams.get("dateTo") || new Date().toISOString().split("T")[0];

  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin", "owner"]);
  if (storeIds.length === 0) return NextResponse.json({ data: [] });

  if (storeId && !storeIds.includes(storeId)) {
    return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
  }

  const supabase = createServiceClient();
  
  // 1. Get Cash Movements
  let query = supabase
    .from("cash_movements")
    .select("created_at, amount, movement_type")
    .gte("created_at", `${dateFrom}T00:00:00`)
    .lte("created_at", `${dateTo}T23:59:59`);

  if (storeId) query = query.eq("store_id", storeId);
  else query = query.in("store_id", storeIds);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // 2. Summarize by date
  const summary: Record<string, CashReportRow> = {};

  (data || []).forEach((m) => {
    const date = new Date(m.created_at).toISOString().split("T")[0];
    if (!summary[date]) {
      summary[date] = { date, cashIn: 0, cashOut: 0 };
    }
    
    if (m.movement_type === "in") {
      summary[date].cashIn += Number(m.amount);
    } else {
      summary[date].cashOut += Number(m.amount);
    }
  });

  const result = Object.values(summary).sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ data: result });
}
