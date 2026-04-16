import { ProductUnitManagement } from "@/components/admin/product-unit-management";

export default function AdminProductUnitsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Admin / Satuan</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Satuan Produk</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola satuan untuk pengisian master produk dan transaksi inventori.
        </p>
      </header>
      <ProductUnitManagement />
    </div>
  );
}

