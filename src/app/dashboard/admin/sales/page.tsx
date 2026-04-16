import { SaleManagement } from "@/components/admin/sale-management";

export default function AdminSalesPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Admin / Penjualan</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Penjualan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pantau histori transaksi, detail penjualan, dan kelola void/refund.
        </p>
      </header>
      <SaleManagement />
    </div>
  );
}

