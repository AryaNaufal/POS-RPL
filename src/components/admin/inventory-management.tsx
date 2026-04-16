"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Store } from "@/types/entities/store";
import type { Product } from "@/types/entities/product";
import type { ProductStock } from "@/types/entities/product-stock";
import type { StockMovement } from "@/types/entities/stock-movement";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type StockRow = ProductStock & {
  products?: { id: string; sku: string; name: string; min_stock?: number } | null;
  stores?: { id: string; code: string; name: string } | null;
};

type MovementRow = StockMovement & {
  products?: { sku: string; name: string } | null;
  stores?: { code: string; name: string } | null;
};

export function InventoryManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [adjustType, setAdjustType] = useState<"adjustment_in" | "adjustment_out">("adjustment_in");
  const [adjustQty, setAdjustQty] = useState("1");
  const [adjustNote, setAdjustNote] = useState("");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function loadOptionsAndProducts() {
    const optionsRes = await fetch("/api/admin/product-master/options", { cache: "no-store" });
    const optionsBody = (await optionsRes.json().catch(() => null)) as ApiSuccess<{ stores: Store[] }> | ApiError | null;
    if (!optionsRes.ok || !optionsBody || !("data" in optionsBody)) {
      throw new Error((optionsBody as ApiError)?.message ?? (optionsBody as ApiError)?.error ?? "Gagal memuat store");
    }
    const storesData: Store[] = optionsBody.data.stores ?? [];
    setStores(storesData);
    if (!selectedStoreId && storesData.length > 0) {
      setSelectedStoreId(storesData[0].id);
    }

    const productsRes = await fetch("/api/admin/products", { cache: "no-store" });
    const productsBody = (await productsRes.json().catch(() => null)) as ApiSuccess<Product[]> | ApiError | null;
    if (!productsRes.ok || !productsBody || !("data" in productsBody)) {
      throw new Error((productsBody as ApiError)?.message ?? (productsBody as ApiError)?.error ?? "Gagal memuat produk");
    }
    setProducts(productsBody?.data ?? []);
  }

  async function loadStocks() {
    if (!selectedStoreId) {
      setStocks([]);
      return;
    }
    const params = new URLSearchParams({ storeId: selectedStoreId });
    if (keyword.trim()) params.set("keyword", keyword.trim());
    const response = await fetch(`/api/admin/inventory/stocks?${params.toString()}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<StockRow[]> | ApiError | null;
    if (!response.ok || !body || !("data" in body)) {
      throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat stok");
    }
    setStocks(body?.data ?? []);
  }

  async function loadMovements() {
    const params = new URLSearchParams({ limit: "25" });
    if (selectedStoreId) params.set("storeId", selectedStoreId);
    const response = await fetch(`/api/admin/inventory/movements?${params.toString()}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<MovementRow[]> | ApiError | null;
    if (!response.ok || !body || !("data" in body)) {
      throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat mutasi stok");
    }
    setMovements(body?.data ?? []);
  }

  async function bootstrap() {
    setLoading(true);
    setError(null);
    try {
      await loadOptionsAndProducts();
    } catch (err: any) {
      setError(err?.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedStoreId) return;
    (async () => {
      setError(null);
      try {
        await Promise.all([loadStocks(), loadMovements()]);
      } catch (err: any) {
        setError(err?.message ?? "Gagal memuat data inventori");
      }
    })();
  }, [selectedStoreId]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAdjustModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  async function searchStocks() {
    setError(null);
    try {
      await loadStocks();
    } catch (err: any) {
      setError(err?.message ?? "Gagal memuat stok");
    }
  }

  async function submitAdjustment() {
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const qty = Number(adjustQty);
    const response = await fetch("/api/admin/inventory/adjustments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedProductId,
        storeId: selectedStoreId,
        type: adjustType,
        qty,
        note: adjustNote,
      }),
    });
    const body = (await response.json().catch(() => null)) as ApiError | null;
    if (!response.ok) {
      setError(body?.message ?? body?.error ?? "Gagal adjustment stok");
      setSubmitting(false);
      setIsConfirmOpen(false);
      return;
    }

    setMessage("Adjustment stok berhasil disimpan.");
    setAdjustNote("");
    setAdjustQty("1");
    setIsConfirmOpen(false);
    setSubmitting(false);
    setIsAdjustModalOpen(false);
    await Promise.all([loadStocks(), loadMovements()]);
  }

  const lowStockCount = useMemo(
    () =>
      stocks.filter(
        (item) =>
          Number(item.qty_on_hand) <= Number(item.products?.min_stock ?? 0)
      ).length,
    [stocks]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Stok & Mutasi Minimum
        </p>
        <Button 
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 uppercase text-xs"
            onClick={() => setIsAdjustModalOpen(true)}
        >
            Manual Adjustment
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_350px]">
          <Card className="card-retail">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl font-black uppercase tracking-tighter text-primary">Status Inventori Produk</CardTitle>
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
                        Low stock: {lowStockCount}
                    </p>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
                <select
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
                  value={selectedStoreId}
                  onChange={(event) => setSelectedStoreId(event.target.value)}
                >
                  <option value="">Pilih Toko</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <Input
                  className="rounded-xl border-border/60"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Cari SKU / nama produk..."
                />
                <Button variant="outline" className="rounded-xl font-bold uppercase text-xs px-6" onClick={searchStocks}>
                  Cari
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? <p className="text-sm text-muted-foreground italic">Memuat data inventori...</p> : null}
              {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-700 font-medium">{message}</p> : null}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {stocks.map((item) => (
                  <div key={item.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.products?.sku}</p>
                                <p className="truncate text-sm font-black text-foreground uppercase tracking-tight">
                                    {item.products?.name}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className={cn(
                                    "text-2xl font-black tracking-tighter",
                                    Number(item.qty_on_hand) <= Number(item.products?.min_stock ?? 0) ? "text-red-600" : "text-emerald-600"
                                )}>
                                    {item.qty_on_hand}
                                </p>
                                <p className="text-[9px] font-bold uppercase text-muted-foreground -mt-1">Unit</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/40">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Min: {item.products?.min_stock ?? 0}</p>
                            <span className={cn(
                                "h-1.5 w-1.5 rounded-full",
                                Number(item.qty_on_hand) <= Number(item.products?.min_stock ?? 0) ? "bg-red-500" : "bg-emerald-500"
                            )}></span>
                        </div>
                    </div>
                  </div>
                ))}
                {!loading && stocks.length === 0 ? (
                  <div className="col-span-full py-20 text-center italic text-muted-foreground">Belum ada data stok untuk kriteria ini.</div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="card-retail h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Aktivitas Stok Terbaru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex flex-col gap-1 border-b border-border/40 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-foreground uppercase tracking-tight truncate">
                        {movement.products?.name}
                    </p>
                    <span className="text-xs font-black text-primary">
                        {movement.movement_type.includes("out") || movement.movement_type === "sale" ? "-" : "+"}{movement.qty}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className={cn(
                      "text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-tighter",
                      movement.movement_type.includes("in") || movement.movement_type === "purchase" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {movement.movement_type}
                    </span>
                    <p className="text-[9px] font-bold text-muted-foreground italic">
                      {new Date(movement.created_at).toLocaleString("id-ID", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
              {movements.length === 0 && !loading ? (
                <p className="text-[10px] text-muted-foreground text-center py-10 italic tracking-wider">Belum ada mutasi stok.</p>
              ) : null}
            </CardContent>
          </Card>
        </section>

      {isAdjustModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsAdjustModalOpen(false);
          }}
        >
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">
                        Manual Stock Adjustment
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsAdjustModalOpen(false)}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Produk</label>
                            <select
                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
                                value={selectedProductId}
                                onChange={(event) => setSelectedProductId(event.target.value)}
                                required
                            >
                                <option value="">-- Pilih Produk --</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name} ({product.sku})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipe Penyesuaian</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
                                    value={adjustType}
                                    onChange={(event) =>
                                        setAdjustType(event.target.value as "adjustment_in" | "adjustment_out")
                                    }
                                    required
                                >
                                    <option value="adjustment_in">Barang Masuk (+)</option>
                                    <option value="adjustment_out">Barang Keluar (-)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Jumlah Qty</label>
                                <Input
                                    className="rounded-xl font-bold"
                                    type="number"
                                    min={1}
                                    value={adjustQty}
                                    onChange={(event) => setAdjustQty(event.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alasan / Catatan</label>
                            <Input
                                className="rounded-xl"
                                value={adjustNote}
                                onChange={(event) => setAdjustNote(event.target.value)}
                                placeholder="Contoh: Barang rusak, retur supplier, dll"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="rounded-xl font-bold uppercase text-xs"
                                onClick={() => setIsAdjustModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button 
                                type="button" 
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 uppercase text-xs"
                                onClick={() => {
                                    if (!selectedProductId || Number(adjustQty) <= 0) {
                                        setError("Pilih produk dan isi Qty dengan benar.");
                                        return;
                                    }
                                    setIsConfirmOpen(true);
                                }}
                            >
                                Update Stok
                            </Button>
                        </div>
                    </div>

                    <ConfirmActionDialog
                        open={isConfirmOpen}
                        onOpenChange={setIsConfirmOpen}
                        title="Konfirmasi Adjustment Stok"
                        description={`Anda akan melakukan penyesuaian stok ${adjustType === 'adjustment_in' ? 'masuk' : 'keluar'} sebanyak ${adjustQty} unit. Lanjutkan?`}
                        confirmLabel="Ya, Update Stok"
                        variant={adjustType === 'adjustment_out' ? 'destructive' : 'default'}
                        loading={submitting}
                        onConfirm={submitAdjustment}
                    />
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}


