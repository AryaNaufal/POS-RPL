import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import { getAccessibleStoreIds } from "@/lib/auth/store-scope";
import type { SalesReportRow } from "@/types/views/report";

type SaleRow = {
  id: string;
  sold_at: string;
  grand_total: number | string;
};

type SaleItemRow = {
  sale_id: string;
  qty: number | string;
};

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
    .from("sales")
    .select("id, sold_at, grand_total, subtotal, discount_total, tax_total")
    .eq("status", "completed")
    .gte("sold_at", `${dateFrom}T00:00:00`)
    .lte("sold_at", `${dateTo}T23:59:59`);

  if (storeId) query = query.eq("store_id", storeId);
  else query = query.in("store_id", storeIds);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const sales = (data ?? []) as SaleRow[];
  const saleIds = sales.map((sale) => sale.id);

  let qtyBySaleId = new Map<string, number>();
  if (saleIds.length > 0) {
    const { data: saleItems, error: saleItemsError } = await supabase
      .from("sale_items")
      .select("sale_id, qty")
      .in("sale_id", saleIds);

    if (saleItemsError) {
      return NextResponse.json({ error: saleItemsError.message }, { status: 400 });
    }

    qtyBySaleId = ((saleItems ?? []) as SaleItemRow[]).reduce((map, row) => {
      const saleId = String(row.sale_id ?? "");
      if (!saleId) return map;
      const current = map.get(saleId) ?? 0;
      map.set(saleId, current + Number(row.qty ?? 0));
      return map;
    }, new Map<string, number>());
  }

  // Group by date
  const dailyReport = sales.reduce((acc: Record<string, SalesReportRow>, sale) => {
    const date = new Date(sale.sold_at).toISOString().split("T")[0];
    if (!acc[date]) {
      acc[date] = { date, count: 0, total: 0, items_sold: 0 };
    }
    acc[date].count += 1;
    acc[date].total += Number(sale.grand_total);
    acc[date].items_sold += qtyBySaleId.get(String(sale.id)) ?? 0;
    return acc;
  }, {});

  const result = Object.values(dailyReport).sort((a, b) => b.date.localeCompare(a.date));

  return NextResponse.json({ data: result });
}
