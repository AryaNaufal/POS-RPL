import { StoreManagement } from "@/components/admin/store-management";

export default function AdminStoresPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Admin / Toko</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Master Toko</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola data toko yang menjadi scope akses Anda.
        </p>
      </header>
      <StoreManagement />
    </div>
  );
}

