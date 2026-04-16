import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/service";
import { TrendingUp, Users, Store, AlertCircle, ShoppingBag } from "lucide-react";
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
    { count: activeStoresCount },
    { count: productCount },
    { count: customerCount },
    { count: supplierCount },
    { data: lowStockRows },
  ] = await Promise.all([
    supabase.from("sales").select("grand_total").eq("status", "completed").gte("sold_at", today.toISOString()),
    supabase.from("sales").select("grand_total").eq("status", "completed").gte("sold_at", startOfMonth.toISOString()),
    supabase.from("stores").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("suppliers").select("id", { count: "exact", head: true }),
    supabase.from("product_stocks").select("qty_on_hand, products(min_stock)").limit(500),
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
            Ringkasan performa POS inti (single store scope).
          </p>
        </div>
        <Link href="/dashboard/admin/reports" className="btn-retail bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20">
          Lihat Laporan
        </Link>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="card-retail border-l-4 border-l-emerald-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> Omzet Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-emerald-700 tracking-tighter">{formatRupiah(omzetHariIni)}</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Bulan ini: {formatRupiah(omzetBulanIni)}</p>
          </CardContent>
        </Card>

        <Card className="card-retail border-l-4 border-l-blue-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ShoppingBag className="w-3 h-3 text-blue-500" /> Produk Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-blue-700 tracking-tighter">{productCount ?? 0} Item</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Cabang aktif: {activeStoresCount ?? 0}</p>
          </CardContent>
        </Card>

        <Card className="card-retail border-l-4 border-l-amber-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Store className="w-3 h-3 text-amber-500" /> Transaksi Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-amber-700 tracking-tighter">{todaySales?.length ?? 0} Nota</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Status completed</p>
          </CardContent>
        </Card>

        <Card className="card-retail border-l-4 border-l-red-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <AlertCircle className="w-3 h-3 text-red-500" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-red-700 tracking-tighter">{lowStockCount} Produk</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">Prioritas restok</p>
          </CardContent>
        </Card>

        <Card className="card-retail border-l-4 border-l-cyan-500 overflow-hidden relative group">
          <CardHeader className="pb-2 space-y-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Users className="w-3 h-3 text-cyan-500" /> Customer & Supplier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-black text-cyan-700 tracking-tighter">{customerCount ?? 0} Customer</p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{supplierCount ?? 0} Supplier</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/admin/products" className="card-retail p-6 group hover:border-primary/50 transition-all flex flex-col justify-between">
          <ShoppingBag className="w-8 h-8 text-primary mb-4" />
          <div>
            <h3 className="font-black uppercase text-sm tracking-tight">Katalog Produk</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">Kelola harga dan data produk</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/purchases" className="card-retail p-6 group hover:border-emerald-500/50 transition-all flex flex-col justify-between">
          <TrendingUp className="w-8 h-8 text-emerald-500 mb-4" />
          <div>
            <h3 className="font-black uppercase text-sm tracking-tight text-emerald-700">Restok Barang</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">Buat PO dan terima barang</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/users" className="card-retail p-6 group hover:border-blue-500/50 transition-all flex flex-col justify-between">
          <Users className="w-8 h-8 text-blue-500 mb-4" />
          <div>
            <h3 className="font-black uppercase text-sm tracking-tight text-blue-700">Manajemen Tim</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">Atur hak akses admin dan kasir</p>
          </div>
        </Link>
        <Link href="/dashboard/admin/inventory" className="card-retail p-6 group hover:border-amber-500/50 transition-all flex flex-col justify-between">
          <AlertCircle className="w-8 h-8 text-amber-500 mb-4" />
          <div>
            <h3 className="font-black uppercase text-sm tracking-tight text-amber-700">Inventori</h3>
            <p className="text-xs text-muted-foreground font-medium mt-1">Pantau stok dan low stock</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
