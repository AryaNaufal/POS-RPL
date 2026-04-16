import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";
import type { PurchaseReportRow } from "@/types/views/report";

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
  let query = supabase
    .from("purchases")
    .select("ordered_at, grand_total")
    .eq("status", "received")
    .gte("ordered_at", `${dateFrom}T00:00:00`)
    .lte("ordered_at", `${dateTo}T23:59:59`);

  if (storeId) query = query.eq("store_id", storeId);
  else query = query.in("store_id", storeIds);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Group by date
  const dailyReport = (data || []).reduce((acc: Record<string, PurchaseReportRow>, purchase) => {
    const date = new Date(purchase.ordered_at).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = { date, count: 0, total: 0 };
    }
    acc[date].count += 1;
    acc[date].total += Number(purchase.grand_total);
    return acc;
  }, {});

  const result = Object.values(dailyReport).sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ data: result });
}
