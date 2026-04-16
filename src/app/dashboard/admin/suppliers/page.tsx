import { SupplierManagement } from "@/components/admin/supplier-management";

export default function AdminSuppliersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Admin / Supplier</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Master Supplier</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola data supplier untuk proses pembelian dan histori pengadaan barang.
        </p>
      </header>
      <SupplierManagement />
    </div>
  );
}


