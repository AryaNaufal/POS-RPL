"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CashierShift } from "@/types/entities/cashier-shift";
import type { ApiSuccess, ApiError } from "@/types/common/api";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ShiftManagement({ storeId }: { storeId: string }) {
  const [shift, setShift] = useState<CashierShift | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openingCash, setOpeningCash] = useState("0");
  const [closingCash, setClosingCash] = useState("0");
  const [note, setNote] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);

  async function loadActiveShift() {
    setLoading(true);
    try {
      const response = await fetch(`/api/kasir/shifts/active?storeId=${storeId}`);
      const body = (await response.json().catch(() => null)) as ApiSuccess<CashierShift> | ApiError | null;
      if (response.ok && body && "data" in body) {
        setShift(body.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadActiveShift();
  }, [storeId]);

  async function openShift() {
    setError(null);
    try {
      const response = await fetch("/api/kasir/shifts/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          openingCash: Number(openingCash),
          note,
        }),
      });
      const body = (await response.json().catch(() => null)) as ApiSuccess<CashierShift> | ApiError | null;
      if (!response.ok || !body || !("data" in body)) {
        throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal membuka shift");
      }
      setShift(body.data);
      setNote("");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function closeShift() {
    setClosing(true);
    setError(null);
    try {
      const response = await fetch("/api/kasir/shifts/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          closingCash: Number(closingCash),
          note,
        }),
      });
      const body = (await response.json().catch(() => null)) as ApiSuccess<CashierShift> | ApiError | null;
      if (!response.ok) {
        throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal menutup shift");
      }
      setShift(null);
      setNote("");
      setClosingCash("0");
      setIsConfirmOpen(false);
      // alert used for success message is fine as per standard non-confirm alert
    } catch (err: any) {
      setError(err.message);
      setIsConfirmOpen(false);
    } finally {
      setClosing(false);
    }
  }

  if (loading) return <p className="text-sm">Memuat status shift...</p>;

  if (!shift) {
    return (
      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Buka Shift Kasir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Modal Awal (Cash)
            <Input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} min="0" />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Catatan
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
          </label>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={openShift}>
            Buka Shift Sekarang
          </Button>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Shift Sedang Aktif</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-100">
          <p className="text-xs text-emerald-700 font-semibold uppercase">Dibuka Sejak</p>
          <p className="text-sm font-bold text-emerald-900">{new Date(shift.opened_at).toLocaleString("id-ID")}</p>
          <p className="mt-2 text-xs text-emerald-700 font-semibold uppercase">Modal Awal</p>
          <p className="text-sm font-bold text-emerald-900">{formatRupiah(shift.opening_cash)}</p>
        </div>

        <label className="block text-xs font-medium text-muted-foreground">
          Uang di Laci (Closing Cash)
          <Input type="number" value={closingCash} onChange={(e) => setClosingCash(e.target.value)} min="0" />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Catatan Penutup
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
        </label>
        <Button variant="destructive" className="w-full" onClick={() => setIsConfirmOpen(true)}>
          Tutup Shift (Selesai Kerja)
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </CardContent>

      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Tutup Shift Kasir"
        description="Apakah Anda yakin ingin menutup shift sekarang? Pastikan jumlah uang di laci sudah sesuai dengan yang Anda input."
        confirmLabel="Tutup Shift"
        variant="destructive"
        loading={closing}
        onConfirm={closeShift}
      />
    </Card>
  );
}

