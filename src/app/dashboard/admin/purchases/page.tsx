import { PurchaseManagement } from "@/components/admin/purchase-management";

export default function AdminPurchasesPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Admin / Pembelian</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Pembelian</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Buat draft purchase order dan pantau status pembelian per store.
        </p>
      </header>
      <PurchaseManagement />
    </div>
  );
}

