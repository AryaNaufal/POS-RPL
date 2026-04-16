"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ShiftManagement() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadShifts() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/shifts", { cache: "no-store" });
      const body = await response.json();
      if (response.ok) {
        setShifts(body.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShifts();
  }, []);

  return (
    <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Histori Shift Kasir</CardTitle>
        <Button variant="outline" size="sm" onClick={loadShifts}>Refresh</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2">Waktu Buka</th>
              <th className="pb-2">Waktu Tutup</th>
              <th className="pb-2">Store</th>
              <th className="pb-2">Kasir</th>
              <th className="pb-2 text-right">Awal</th>
              <th className="pb-2 text-right">Akhir</th>
              <th className="pb-2 text-right">Ekspektasi</th>
              <th className="pb-2 text-right">Selisih</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={9} className="py-4 text-center">Memuat...</td></tr>}
            {!loading && shifts.length === 0 && <tr><td colSpan={9} className="py-4 text-center">Tidak ada histori shift.</td></tr>}
            {shifts.map((s) => (
              <tr key={s.id} className="last:border-b-0">
                <td className="py-2">{new Date(s.opened_at).toLocaleString("id-ID")}</td>
                <td className="py-2">{s.closed_at ? new Date(s.closed_at).toLocaleString("id-ID") : "-"}</td>
                <td className="py-2">{s.stores?.name}</td>
                <td className="py-2">{s.cashier?.name}</td>
                <td className="py-2 text-right">{formatRupiah(s.opening_cash)}</td>
                <td className="py-2 text-right">{s.closing_cash !== null ? formatRupiah(s.closing_cash) : "-"}</td>
                <td className="py-2 text-right">{s.expected_cash !== null ? formatRupiah(s.expected_cash) : "-"}</td>
                <td className="py-2 text-right font-bold" style={{ color: (s.cash_difference ?? 0) < 0 ? "red" : (s.cash_difference ?? 0) > 0 ? "green" : "inherit" }}>
                  {s.cash_difference !== null ? formatRupiah(s.cash_difference) : "-"}
                </td>
                <td className="py-2 uppercase font-semibold text-[10px]">
                  <span className={s.status === "open" ? "text-emerald-600" : "text-gray-600"}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

