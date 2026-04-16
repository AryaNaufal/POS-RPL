"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SaleDetail } from "./sale-detail";
import type { Sale } from "@/types/entities/sale";
import type { Store } from "@/types/entities/store";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type SaleWithRelations = Sale & {
  stores?: Pick<Store, "id" | "name"> | null;
  customers?: { name: string } | null;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SaleManagement() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [stores, setStores] = useState<Pick<Store, "id" | "name">[]>([]);
  const [sales, setSales] = useState<SaleWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [storeId, setStoreId] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);

  async function loadOptions() {
    const response = await fetch("/api/admin/purchase-master/options", { cache: "no-store" }); // Reusing purchase options for stores
    const body = (await response.json().catch(() => null)) as ApiSuccess<{ stores: Store[] }> | ApiError | null;
    if (response.ok && body && "data" in body) {
      setStores(body.data.stores ?? []);
    }
  }

  async function loadSales() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (storeId) params.set("storeId", storeId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/admin/sales${query}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<SaleWithRelations[]> | ApiError | null;
    if (!response.ok || !body || !("data" in body)) {
      setError((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat data penjualan");
      setLoading(false);
      return;
    }

    setSales(body.data);
    setLoading(false);
  }

  useEffect(() => {
    loadOptions();
    loadSales();
  }, []);

  if (selectedSaleId) {
    return (
      <SaleDetail 
        saleId={selectedSaleId} 
        onBack={() => {
          setSelectedSaleId(null);
          loadSales();
        }} 
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <Card className="card-retail overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl font-black text-primary uppercase tracking-tighter">Histori Penjualan (POS)</CardTitle>
            <div className="flex gap-1 p-1 bg-secondary rounded-lg">
                <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="h-8 text-[10px] font-bold uppercase rounded-md" onClick={() => setViewMode('grid')}>Grid</Button>
                <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="h-8 text-[10px] font-bold uppercase rounded-md" onClick={() => setViewMode('list')}>List</Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_200px_auto_auto]">
            <Input
              className="rounded-xl border-border/60"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari nomor invoice..."
            />
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
            >
              <option value="">Semua Store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => loadSales()}>
              Cari
            </Button>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => loadSales()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground italic">Memuat data transaksi...</p> : null}
          {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}

          {!loading && sales.length === 0 ? (
            <div className="py-20 text-center italic text-muted-foreground">Belum ada histori transaksi.</div>
          ) : null}

          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sales.map((sale) => (
                    <button
                        key={sale.id}
                        onClick={() => setSelectedSaleId(sale.id)}
                        className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-5 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{sale.stores?.name}</p>
                                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{sale.invoice_no}</span>
                                </div>
                                <span
                                    className={cn(
                                        "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tight",
                                        sale.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-foreground"
                                    )}
                                >
                                    {sale.status}
                                </span>
                            </div>
                            
                            <div className="flex flex-col">
                                <p className="text-xs font-bold text-muted-foreground italic">Pelanggan</p>
                                <p className="text-sm font-black text-foreground uppercase tracking-tight">{sale.customers?.name || "WALK-IN CUSTOMER"}</p>
                            </div>

                            <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-3">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {new Date(sale.sold_at).toLocaleDateString("id-ID")}
                                </span>
                                <span className="text-lg font-black text-primary">
                                    {formatRupiah(Number(sale.grand_total ?? 0))}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-secondary/30 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground border-y border-border/40">
                            <th className="px-4 py-3 text-left">Invoice</th>
                            <th className="px-4 py-3 text-left">Tanggal</th>
                            <th className="px-4 py-3 text-left">Store</th>
                            <th className="px-4 py-3 text-left">Pelanggan</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {sales.map((sale) => (
                            <tr 
                                key={sale.id} 
                                onClick={() => setSelectedSaleId(sale.id)}
                                className="hover:bg-primary/5 transition-colors group cursor-pointer"
                            >
                                <td className="px-4 py-3 font-bold text-primary">{sale.invoice_no}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{new Date(sale.sold_at).toLocaleDateString("id-ID")}</td>
                                <td className="px-4 py-3 font-medium uppercase text-[10px]">{sale.stores?.name}</td>
                                <td className="px-4 py-3 font-medium uppercase text-[10px]">{sale.customers?.name || "WALK-IN"}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                                        sale.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-secondary text-foreground"
                                    )}>
                                        {sale.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-black">{formatRupiah(Number(sale.grand_total ?? 0))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

