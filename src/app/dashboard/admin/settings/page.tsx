import { SettingsManagement } from "@/components/admin/settings-management";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Admin / Pengaturan</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Pengaturan Sistem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Konfigurasi nama toko, alamat, pajak, dan pengaturan struk.
        </p>
      </header>
      <SettingsManagement />
    </div>
  );
}
