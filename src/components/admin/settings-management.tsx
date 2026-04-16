"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AppSettingKey, UpdateAppSettingInput } from "@/types/forms/app-setting-form";
import type { ApiSuccess, ApiError } from "@/types/common/api";

export function SettingsManagement() {
  const [settings, setSettings] = useState<Record<string, any>>({
    company_name: "",
    company_address: "",
    company_phone: "",
    invoice_prefix: "INV-",
    tax_percentage: "0",
    footer_note: "Terima kasih sudah berbelanja!",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  async function loadSettings() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as ApiSuccess<Record<string, any>> | ApiError | null;
      if (response.ok && body && "data" in body) {
        setSettings((prev) => ({ ...prev, ...body.data }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function saveSettings() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
          setIsConfirmOpen(false);
          // Alert for success is fine
          alert("Pengaturan berhasil disimpan");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Memuat...</p>;

  return (
    <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Profil & Operasional</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-muted-foreground">
            Nama Perusahaan / Toko
            <Input value={settings.company_name} onChange={(e) => setSettings({ ...settings, company_name: e.target.value })} />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Telepon
            <Input value={settings.company_phone} onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })} />
          </label>
        </div>
        <label className="block text-xs font-medium text-muted-foreground">
          Alamat
          <Input value={settings.company_address} onChange={(e) => setSettings({ ...settings, company_address: e.target.value })} />
        </label>
        
        <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
          <label className="block text-xs font-medium text-muted-foreground">
            Prefix Invoice
            <Input value={settings.invoice_prefix} onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })} />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Pajak (%)
            <Input type="number" value={settings.tax_percentage} onChange={(e) => setSettings({ ...settings, tax_percentage: e.target.value })} />
          </label>
        </div>

        <label className="block text-xs font-medium text-muted-foreground">
          Pesan Kaki (Footer Struk)
          <Input value={settings.footer_note} onChange={(e) => setSettings({ ...settings, footer_note: e.target.value })} />
        </label>

        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setIsConfirmOpen(true)} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
        </Button>

        <ConfirmActionDialog
            open={isConfirmOpen}
            onOpenChange={setIsConfirmOpen}
            title="Simpan Pengaturan"
            description="Apakah Anda yakin ingin menyimpan perubahan pengaturan ini? Perubahan akan langsung berdampak pada operasional sistem (seperti prefix invoice dan pajak)."
            confirmLabel="Simpan Perubahan"
            loading={saving}
            onConfirm={saveSettings}
        />
      </CardContent>
    </Card>
  );
}

