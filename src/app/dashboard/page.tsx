import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import type { Sale } from "@/types/entities/sale";
import type { SaleItem } from "@/types/entities/sale-item";
import type { ProductStock } from "@/types/entities/product-stock";
import type { StockMovement } from "@/types/entities/stock-movement";
import type { CashierShift } from "@/types/entities/cashier-shift";
import type { Store } from "@/types/entities/store";
import type { 
  DashboardSummaryCard, 
  RecentTransactionItem, 
  LowStockItem 
} from "@/types/views/dashboard";

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

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/");
  }

  const supabase = createServiceClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const { data: userStoreRaw } = await supabase
    .from("user_store_roles")
    .select("store_id, stores(*)")
    .eq("user_id", session.userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  const userStore = userStoreRaw as unknown as UserStoreWithStore | null;

  const { data: fallbackStoreRaw } = await supabase
    .from("stores")
    .select("*")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  
  const fallbackStore = fallbackStoreRaw as Store | null;

  const activeStore = userStore?.stores ?? fallbackStore;
  if (!activeStore?.id) {
    redirect("/dashboard/admin");
  }

  const { data: todaySalesRaw } = await supabase
    .from("sales")
    .select("id, grand_total, status")
    .eq("store_id", activeStore.id)
    .gte("sold_at", startOfToday.toISOString());

  const todaySales = (todaySalesRaw ?? []) as Sale[];

  const completedTodaySales = todaySales.filter(
    (sale) => sale.status === "completed"
  );
  const omzetHariIni = completedTodaySales.reduce(
    (sum, sale) => sum + Number(sale.grand_total ?? 0),
    0
  );
  const transaksiHariIni = completedTodaySales.length;

  const saleIds = completedTodaySales.map((sale) => sale.id);
  let produkTerjualHariIni = 0;
  if (saleIds.length > 0) {
    const { data: soldItemsRaw } = await supabase
      .from("sale_items")
      .select("qty")
      .in("sale_id", saleIds);
    const soldItems = (soldItemsRaw ?? []) as SaleItem[];
    produkTerjualHariIni = soldItems.reduce(
      (sum, item) => sum + Number(item.qty ?? 0),
      0
    );
  }

  const { data: cashierAssignments } = await supabase
    .from("user_store_roles")
    .select("id, roles!inner(code)")
    .eq("store_id", activeStore.id)
    .eq("is_active", true)
    .eq("roles.code", "kasir");

  const kasirAktif = cashierAssignments?.length ?? 0;

  const summaryCards: DashboardSummaryCard[] = [
    {
      title: "Omzet Hari Ini",
      value: formatRupiah(omzetHariIni),
      note: `Store ${activeStore.code}`,
    },
    {
      title: "Transaksi Hari Ini",
      value: String(transaksiHariIni),
      note: "Status completed",
    },
    {
      title: "Produk Terjual",
      value: String(produkTerjualHariIni),
      note: "Akumulasi qty item",
    },
    {
      title: "Kasir Aktif",
      value: String(kasirAktif),
      note: "Berdasarkan assignment role",
    },
  ];

  const { data: recentSalesRowsRaw } = await supabase
    .from("sales")
    .select("invoice_no, grand_total, status, customers(name)")
    .eq("store_id", activeStore.id)
    .order("sold_at", { ascending: false })
    .limit(5);

  const recentSalesRows = (recentSalesRowsRaw ?? []) as (Sale & { customers: { name: string } | null })[];

  const recentTransactions: RecentTransactionItem[] = recentSalesRows.map((sale) => ({
    code: sale.invoice_no,
    customer: sale.customers?.name ?? "Walk-in",
    total: formatRupiah(Number(sale.grand_total ?? 0)),
    status:
      sale.status === "completed"
        ? "Selesai"
        : sale.status === "draft"
          ? "Draft"
          : sale.status === "void"
            ? "Void"
            : "Refund",
  }));

  const { data: stockRowsRaw } = await supabase
    .from("product_stocks")
    .select("qty_on_hand, products(name, min_stock)")
    .eq("store_id", activeStore.id)
    .limit(60);

  const stockRows = (stockRowsRaw ?? []) as (ProductStock & { products: { name: string; min_stock: number } | null })[];

  const lowStock: LowStockItem[] = stockRows
    .map((row) => ({
      name: row.products?.name ?? "-",
      stock: Number(row.qty_on_hand ?? 0),
      minStock: Number(row.products?.min_stock ?? 0),
      unit: "pcs",
    }))
    .filter((row) => row.stock <= row.minStock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 4);

  const { data: latestMovementsRaw } = await supabase
    .from("stock_movements")
    .select("movement_type, qty, products(name)")
    .eq("store_id", activeStore.id)
    .order("created_at", { ascending: false })
    .limit(2);

  const latestMovements = (latestMovementsRaw ?? []) as (StockMovement & { products: { name: string } | null })[];

  const { data: latestShiftsRaw } = await supabase
    .from("cashier_shifts")
    .select("status, users(name), opened_at")
    .eq("store_id", activeStore.id)
    .order("opened_at", { ascending: false })
    .limit(2);

  const latestShifts = (latestShiftsRaw ?? []) as (CashierShift & { users: { name: string } | null })[];

  const activities: string[] = [
    ...latestMovements.map((item) => {
      const label =
        item.movement_type === "adjustment_in"
          ? "Adjustment Masuk"
          : item.movement_type === "adjustment_out"
            ? "Adjustment Keluar"
            : item.movement_type;
      return `${label}: ${item.products?.name ?? "Produk"} qty ${item.qty}`;
    }),
    ...latestShifts.map((item) => {
      const status = item.status === "open" ? "membuka shift" : "menutup shift";
      return `${item.users?.name ?? "Kasir"} ${status}`;
    }),
  ].slice(0, 4);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(180deg,#f7faf8_0%,#eef4f1_100%)] px-5 py-6 sm:px-8 lg:px-10 lg:py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                POS Dashboard
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Ringkasan Operasional Toko
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Login sebagai <span className="font-medium text-foreground">{session.email}</span>.
                Menampilkan data store <span className="font-medium text-foreground">{activeStore.name}</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LogoutButton />
              <Button asChild variant="outline">
                <Link href="/dashboard/admin">Buka Admin</Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/transaksi/tambah">Tambah Transaksi</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => (
            <Card key={item.title} className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Area Kasir</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Akses cepat ke halaman operasional kasir: transaksi harian, antrian, dan target shift.
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/dashboard/kasir">Buka Halaman Kasir</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Area Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Akses cepat ke halaman admin: ringkasan bisnis, kontrol user, dan monitoring sistem.
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link href="/dashboard/admin">Buka Halaman Admin</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border/70 text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Kode</th>
                    <th className="pb-3 font-medium">Pelanggan</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((item) => (
                    <tr key={item.code} className="border-b border-border/50 last:border-b-0">
                      <td className="py-3 pr-4 font-medium text-foreground">{item.code}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{item.customer}</td>
                      <td className="py-3 pr-4 font-medium text-foreground">{item.total}</td>
                      <td className="py-3">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
              <CardTitle className="text-lg">Stok Menipis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStock.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada stok menipis.</p>
                ) : null}
                {lowStock.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs font-semibold text-amber-700">
                      {item.stock} {item.unit}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Aktivitas Tim</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                {activities.length === 0 ? (
                  <p>Belum ada aktivitas terbaru.</p>
                ) : (
                  activities.map((item) => <p key={item}>{item}</p>)
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

