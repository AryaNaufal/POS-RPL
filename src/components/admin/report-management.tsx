"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SalesReportRow, StockReportRow } from "@/types/views/report";
import type { ApiSuccess, ApiError } from "@/types/common/api";
import { exportReportPdf } from "@/lib/reports/export-report-pdf";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type ActiveTab = "sales" | "stocks";
type ReportDataRow = SalesReportRow | StockReportRow;

export function ReportManagement() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("sales");
  const [data, setData] = useState<ReportDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);

  const loadReport = useCallback(async (tab: ActiveTab, from: string, to: string) => {
    setLoading(true);
    setError(null);

    const url = tab === "stocks"
      ? "/api/admin/reports/stocks"
      : `/api/admin/reports/sales?dateFrom=${from}&dateTo=${to}`;

    try {
      const response = await fetch(url, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as ApiSuccess<ReportDataRow[]> | ApiError | null;
      if (response.ok && body && "data" in body) {
        setData(body.data || []);
      } else {
        throw new Error((body as ApiError)?.message ?? "Gagal memuat laporan");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReport(activeTab, dateFrom, dateTo);
  }, [activeTab, dateFrom, dateTo, loadReport]);

  function exportCSV() {
    if (data.length === 0) return;
    const rows = data as Record<string, unknown>[];

    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = Object.keys(rows[0]).filter((key) => typeof rows[0][key] !== "object");
    csvContent += headers.join(",") + "\r\n";

    rows.forEach((row) => {
      const line = headers
        .map((header) => {
          const value = row[header];
          return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
            ? String(value).replaceAll(",", " ")
            : "";
        })
        .join(",");
      csvContent += line + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `report-${activeTab}-${dateFrom}-to-${dateTo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportPDF() {
    if (data.length === 0) return;

    try {
      if (activeTab === "sales") {
        exportReportPdf({
          type: "sales",
          data: data as SalesReportRow[],
          dateFrom,
          dateTo,
        });
      } else {
        exportReportPdf({
          type: "stocks",
          data: data as StockReportRow[],
        });
      }
    } catch {
      setError("Gagal membuat file PDF.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 p-1 bg-secondary/50 rounded-xl w-fit">
          {(["sales", "stocks"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              className="rounded-lg h-9 px-4 text-xs font-bold uppercase tracking-wider capitalize"
              onClick={() => setActiveTab(tab)}
            >
              {tab === "sales" ? "Penjualan" : "Stok"}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-bold border-primary text-primary hover:bg-primary/5"
            onClick={exportCSV}
            disabled={data.length === 0}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="rounded-xl font-bold border-blue-600 text-blue-700 hover:bg-blue-50"
            onClick={exportPDF}
            disabled={data.length === 0}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg">Filter Laporan</CardTitle>
          {activeTab === "sales" && (
            <div className="flex gap-2 items-center">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40 h-10 rounded-xl" />
              <span className="text-muted-foreground text-xs font-bold uppercase">s/d</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40 h-10 rounded-xl" />
              <Button onClick={() => loadReport(activeTab, dateFrom, dateTo)} className="rounded-xl font-bold">Tampilkan</Button>
            </div>
          )}
        </CardHeader>
      </Card>

      {error && <p className="text-sm text-red-600 font-medium px-2">{error}</p>}
      {loading && <p className="text-sm text-muted-foreground font-medium px-2">Memuat data laporan...</p>}

      {activeTab === "sales" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-2xl bg-emerald-50 border-emerald-100 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Total Penjualan</p>
              <p className="text-3xl font-black text-emerald-900 mt-1">{formatRupiah((data as SalesReportRow[]).reduce((s, i) => s + i.total, 0))}</p>
            </Card>
            <Card className="rounded-2xl bg-blue-50 border-blue-100 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-700">Total Transaksi</p>
              <p className="text-3xl font-black text-blue-900 mt-1">{(data as SalesReportRow[]).reduce((s, i) => s + i.count, 0)} <span className="text-sm font-bold uppercase">Nota</span></p>
            </Card>
            <Card className="rounded-2xl bg-indigo-50 border-indigo-100 p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-700">Produk Terjual</p>
              <p className="text-3xl font-black text-indigo-900 mt-1">{(data as SalesReportRow[]).reduce((s, i) => s + i.items_sold, 0)} <span className="text-sm font-bold uppercase">Qty</span></p>
            </Card>
          </div>
          <Card className="card-retail overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b">
                <tr className="text-left">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tanggal</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qty Nota</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Qty Produk</th>
                  <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Omzet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {(data as SalesReportRow[]).map((item) => (
                  <tr key={item.date} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-bold text-foreground">{item.date}</td>
                    <td className="p-4 text-right font-medium">{item.count}</td>
                    <td className="p-4 text-right font-medium">{item.items_sold}</td>
                    <td className="p-4 text-right font-black text-emerald-700">{formatRupiah(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {activeTab === "stocks" && (
        <Card className="card-retail overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b">
              <tr className="text-left">
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Produk</th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store</th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stok</th>
                <th className="p-4 text-right text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nilai Aset (HPP)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {(data as StockReportRow[]).map((item, idx) => (
                <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-foreground">{item.products?.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{item.products?.sku}</p>
                  </td>
                  <td className="p-4 text-xs font-bold text-blue-700">{item.stores?.name}</td>
                  <td className="p-4 text-right font-black text-foreground">{item.qty_on_hand}</td>
                  <td className="p-4 text-right font-bold text-primary">{formatRupiah(item.qty_on_hand * (item.products?.buy_price || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

