import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/service";
import type { Sale } from "@/types/entities/sale";
import type { SaleItem } from "@/types/entities/sale-item";
import type { Store } from "@/types/entities/store";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type UserStoreWithStore = {
  store_id: string;
  stores: Store | null;
};

export default async function KasirPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/");
  }

  const supabase = createServiceClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: assignmentRaw } = await supabase
    .from("user_store_roles")
    .select("store_id, stores(*)")
    .eq("user_id", session.userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const assignment = assignmentRaw as unknown as UserStoreWithStore | null;
  const activeStore = assignment?.stores;
  if (!activeStore?.id) {
    redirect("/dashboard");
  }

  const { data: salesRowsRaw } = await supabase
    .from("sales")
    .select("id, grand_total, status, discount_total, customer_id, customers(name), invoice_no")
    .eq("store_id", activeStore.id)
    .eq("cashier_id", session.userId)
    .gte("sold_at", startOfToday.toISOString())
    .order("sold_at", { ascending: false });

  const salesRows = (salesRowsRaw ?? []) as unknown as (Sale & { customers: { name: string } | null })[];

  const completedSales = salesRows.filter((sale) => sale.status === "completed");
  const avgValue =
    completedSales.length > 0
      ? completedSales.reduce((sum, sale) => sum + Number(sale.grand_total ?? 0), 0) /
        completedSales.length
      : 0;
  const omzetHariIni = completedSales.reduce((sum, sale) => sum + Number(sale.grand_total ?? 0), 0);

  const shiftStats = [
    { label: "Transaksi Shift Ini", value: String(completedSales.length) },
    { label: "Omzet Hari Ini", value: formatRupiah(omzetHariIni) },
    { label: "Rata-rata Nilai", value: formatRupiah(avgValue) },
  ];

  const recentSaleIds = salesRows.slice(0, 10).map((sale) => sale.id);
  let itemCounts = new Map<string, number>();
  if (recentSaleIds.length > 0) {
    const { data: saleItemsRaw } = await supabase
      .from("sale_items")
      .select("sale_id, qty")
      .in("sale_id", recentSaleIds);
    
    const saleItems = (saleItemsRaw ?? []) as SaleItem[];

    itemCounts = saleItems.reduce((map, item) => {
      const current = map.get(item.sale_id) ?? 0;
      map.set(item.sale_id, current + Number(item.qty ?? 0));
      return map;
    }, new Map<string, number>());
  }

  const queueData = salesRows.slice(0, 10).map((sale) => ({
    id: sale.id,
    code: sale.invoice_no,
    customer: sale.customers?.name ?? "Walk-in",
    item: itemCounts.get(sale.id) ?? 0,
    status:
      sale.status === "completed"
        ? "Selesai"
        : "Selesai",
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <header className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Area Kasir</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">Operasional Shift Kasir</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              User aktif: {session.email} | Store: {activeStore.name}
            </p>
          </div>
          <Link
            href="/dashboard/transaksi/tambah"
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Tambah Transaksi
          </Link>
        </div>
      </header>

      <div className="grid gap-5">
        <div className="flex flex-col gap-5">
          <section className="grid gap-4 sm:grid-cols-2">
            {shiftStats.map((item) => (
              <Card key={item.label} className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Transaksi Kasir Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Kode</th>
                    <th className="pb-3 font-medium">Pelanggan</th>
                    <th className="pb-3 font-medium">Item</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {queueData.length === 0 ? (
                    <tr>
                      <td className="py-3 text-muted-foreground" colSpan={4}>
                        Belum ada transaksi kasir hari ini.
                      </td>
                    </tr>
                  ) : null}
                  {queueData.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{item.code}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{item.customer}</td>
                      <td className="py-3 pr-4 text-foreground">{item.item}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

