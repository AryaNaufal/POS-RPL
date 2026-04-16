import { ProductManagement } from "@/components/admin/product-management";

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Admin / Produk</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Master Produk</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tambah, cari, dan atur status aktif produk.
        </p>
      </header>
      <ProductManagement />
    </div>
  );
}

