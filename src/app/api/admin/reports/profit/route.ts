import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";
import type { ProfitReportRow } from "@/types/views/report";

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
  
  // 1. Get Sales
  let salesQuery = supabase
    .from("sales")
    .select("sold_at, grand_total, subtotal, discount_total, sale_items(product_id, qty)")
    .eq("status", "completed")
    .gte("sold_at", `${dateFrom}T00:00:00`)
    .lte("sold_at", `${dateTo}T23:59:59`);

  if (storeId) salesQuery = salesQuery.eq("store_id", storeId);
  else salesQuery = salesQuery.in("store_id", storeIds);

  const { data: sales, error: salesError } = await salesQuery;
  if (salesError) return NextResponse.json({ error: salesError.message }, { status: 400 });

  // 2. Get Products Buy Price for COGS calculation
  const { data: products } = await supabase.from("products").select("id, buy_price");
  const priceMap = new Map((products || []).map(p => [p.id, Number(p.buy_price || 0)]));

  // 3. Summarize by date
  const summary: Record<string, ProfitReportRow> = {};

  (sales || []).forEach((sale: any) => {
    const date = new Date(sale.sold_at).toISOString().split("T")[0];
    if (!summary[date]) {
      summary[date] = { date, revenue: 0, cost: 0, profit: 0 };
    }
    
    summary[date].revenue += Number(sale.grand_total);
    
    let saleCost = 0;
    (sale.sale_items || []).forEach((item: any) => {
      const buyPrice = priceMap.get(item.product_id) || 0;
      saleCost += buyPrice * Number(item.qty);
    });
    
    summary[date].cost += saleCost;
    summary[date].profit = summary[date].revenue - summary[date].cost;
  });

  const result = Object.values(summary).sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ data: result });
}
