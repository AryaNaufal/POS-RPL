import { ReportManagement } from "@/components/admin/report-management";

export default function AdminReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Admin / Laporan</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Laporan Bisnis</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Lihat laporan penjualan dan stok, lalu export data ke CSV atau PDF.
        </p>
      </header>
      <ReportManagement />
    </div>
  );
}

