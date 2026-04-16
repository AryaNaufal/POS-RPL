import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/service";
import { TrendingUp, Users, Store, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

type LowStockRow = {
  qty_on_hand: number | string | null;
  products: { min_stock: number | string | null } | null;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function AdminPage() {
  const supabase = createServiceClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { data: todaySales },
    { data: monthlySales }, 
    { count: activeUsersCount }, 
    { count: activeStoresCount }, 
    { count: customerCount },
    { count: supplierCount },
    { data: lowStockRows }, 
    { count: openShiftsCount },
    { data: recentLogs }
  ] = await Promise.all([
      supabase.from("sales").select("grand_total").eq("status", "completed").gte("sold_at", today.toISOString()),
      supabase.from("sales").select("grand_total").eq("status", "completed").gte("sold_at", startOfMonth.toISOString()),
      supabase.from("users").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("customers").select("id", { count: "exact", head: true }),
      supabase.from("suppliers").select("id", { count: "exact", head: true }),
      supabase.from("product_stocks").select("qty_on_hand, products(min_stock)").limit(500),
      supabase.from("cashier_shifts").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("audit_logs").select("*, users:actor_user_id(name)").order("created_at", { ascending: false }).limit(5)
    ]);

  const omzetHariIni = (todaySales ?? []).reduce((sum, s) => sum + Number(s.grand_total), 0);
  const omzetBulanIni = (monthlySales ?? []).reduce((sum, s) => sum + Number(s.grand_total), 0);
  
  const lowStockCount = ((lowStockRows ?? []) as LowStockRow[]).filter(
    (row) => Number(row.qty_on_hand ?? 0) <= Number(row.products?.min_stock ?? 0)
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 card-retail p-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Admin Control Center</p>
          <h1 className="mt-1 text-3xl font-black text-foreground tracking-tighter uppercase">Dashboard Ringkasan</h1>
          <p className="mt-1 text-sm text-muted-foreground font-medium italic">
            Selamat datang kembali. Berikut adalah performa jaringan toko Anda hari ini.
          </p>
        </div>
        <div className="flex gap-2">
            <Link href="/dashboard/admin/reports" className="btn-retail bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20">
                Lihat Laporan Detail
            </Link>
        </div>
      </header>

      {/* Primary KPIs */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="card-retail border-l-4 border-l-emerald-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                Omzet Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-700 tracking-tighter">{formatRupiah(omzetHariIni)}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Bulan ini: {formatRupiah(omzetBulanIni)}</p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-12 h-12" />
          </div>
        </Card>

        <Card className="card-retail border-l-4 border-l-blue-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="w-3 h-3 text-blue-500" />
                User Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-blue-700 tracking-tighter">{activeUsersCount ?? 0} Orang</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Tersebar di {activeStoresCount ?? 0} Cabang</p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12" />
          </div>
        </Card>

        <Card className="card-retail border-l-4 border-l-amber-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Store className="w-3 h-3 text-amber-500" />
                Shift Terbuka
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-amber-700 tracking-tighter">{openShiftsCount ?? 0} Pos</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">Memerlukan pemantauan cash</p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Store className="w-12 h-12" />
          </div>
        </Card>

        <Card className="card-retail border-l-4 border-l-red-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-3 h-3 text-red-500" />
                Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-red-700 tracking-tighter">{lowStockCount} Produk</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Segera buat Purchase Order</p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertCircle className="w-12 h-12" />
          </div>
        </Card>

        <Card className="card-retail border-l-4 border-l-cyan-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="w-3 h-3 text-cyan-500" />
                Customer & Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-cyan-700 tracking-tighter">{customerCount ?? 0} Customer</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{supplierCount ?? 0} Supplier</p>
          </CardContent>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-12 h-12" />
          </div>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="card-retail">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                Aktivitas Terkini
                <Link href="/dashboard/admin/audit-logs" className="text-[10px] text-primary hover:underline flex items-center gap-1">
                    Semua Log <ArrowRight className="w-2 h-2" />
                </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {recentLogs?.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-xs border-b border-border/20 pb-3 last:border-0 last:pb-0">
                <div className="bg-secondary p-2 rounded-lg shrink-0">
                    <ShoppingBag className="w-3 h-3 text-muted-foreground" />
                </div>
                <div>
                    <p className="font-bold text-foreground">
                        <span className="text-primary">{log.users?.name || "System"}</span> melakukan <span className="uppercase text-[10px] px-1 bg-blue-100 text-blue-700 rounded font-black">{log.action}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        {log.entity_type} • {new Date(log.created_at).toLocaleString("id-ID")}
                    </p>
                </div>
              </div>
            ))}
            {recentLogs?.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-4">Belum ada aktivitas tercatat.</p>}
          </CardContent>
        </Card>

        {/* Quick Links / Shortcuts */}
        <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard/admin/products" className="card-retail p-6 group hover:border-primary/50 transition-all flex flex-col justify-between">
                <ShoppingBag className="w-8 h-8 text-primary mb-4" />
                <div>
                    <h3 className="font-black uppercase text-sm tracking-tight">Katalog Produk</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Kelola harga & stok barang</p>
                </div>
            </Link>
            <Link href="/dashboard/admin/purchases" className="card-retail p-6 group hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                <TrendingUp className="w-8 h-8 text-emerald-500 mb-4" />
                <div>
                    <h3 className="font-black uppercase text-sm tracking-tight text-emerald-700">Restok Barang</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Buat PO & terima barang</p>
                </div>
            </Link>
            <Link href="/dashboard/admin/users" className="card-retail p-6 group hover:border-blue-500/50 transition-all flex flex-col justify-between">
                <Users className="w-8 h-8 text-blue-500 mb-4" />
                <div>
                    <h3 className="font-black uppercase text-sm tracking-tight text-blue-700">Manajemen Tim</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Atur hak akses kasir & admin</p>
                </div>
            </Link>
            <Link href="/dashboard/admin/settings" className="card-retail p-6 group hover:border-amber-500/50 transition-all flex flex-col justify-between">
                <AlertCircle className="w-8 h-8 text-amber-500 mb-4" />
                <div>
                    <h3 className="font-black uppercase text-sm tracking-tight text-amber-700">Setelan Toko</h3>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Ubah nama, alamat & pajak</p>
                </div>
            </Link>
        </div>
      </div>
    </div>
  );
}
