"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PurchaseDetail } from "./purchase-detail";
import type { Purchase } from "@/types/entities/purchase";
import type { Store } from "@/types/entities/store";
import type { Supplier } from "@/types/entities/supplier";
import type { ApiSuccess, ApiError } from "@/types/common/api";
import { cn } from "@/lib/utils";

type PurchaseWithRelations = Purchase & {
  stores?: Pick<Store, "id" | "code" | "name"> | null;
  suppliers?: Pick<Supplier, "id" | "code" | "name"> | null;
};

type OptionsResponse = ApiSuccess<{
  stores: Store[];
  suppliers: Supplier[];
}>;

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PurchaseManagement() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [stores, setStores] = useState<Store[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<PurchaseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [filterStoreId, setFilterStoreId] = useState("");
  const [filterSupplierId, setFilterSupplierId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftStoreId, setDraftStoreId] = useState("");
  const [draftSupplierId, setDraftSupplierId] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);

  async function loadOptions() {
    const response = await fetch("/api/admin/purchase-master/options", { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as OptionsResponse | ApiError | null;
    if (!response.ok || !body || !("data" in body)) {
      throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat opsi pembelian");
    }
    const nextStores = body.data.stores ?? [];
    setStores(nextStores);
    setSuppliers(body.data.suppliers ?? []);

    if (nextStores.length > 0) {
      if (!filterStoreId) setFilterStoreId(nextStores[0].id);
      if (!draftStoreId) setDraftStoreId(nextStores[0].id);
    }
  }

  async function loadPurchases() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (filterStoreId) params.set("storeId", filterStoreId);
    if (filterSupplierId) params.set("supplierId", filterSupplierId);
    if (filterStatus) params.set("status", filterStatus);

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/admin/purchases${query}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<PurchaseWithRelations[]> | ApiError | null;
    if (!response.ok || !body || !("data" in body)) {
      setError((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat data pembelian");
      setLoading(false);
      return;
    }

    setPurchases(body.data);
    setLoading(false);
  }

  async function bootstrap() {
    setLoading(true);
    setError(null);
    try {
      await loadOptions();
      await loadPurchases();
    } catch (err: any) {
      setError(err?.message ?? "Terjadi kesalahan");
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDraftModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (isDraftModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isDraftModalOpen]);

  const filteredPurchases = useMemo(() => purchases, [purchases]);

  async function createDraftPurchase(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!draftStoreId) {
      setError("Pilih store terlebih dahulu.");
      return;
    }

    const response = await fetch("/api/admin/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: draftStoreId,
        supplierId: draftSupplierId || null,
        note: draftNote.trim() || null,
      }),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Purchase> | ApiError | null;
    if (!response.ok || !body || !("data" in body)) {
      setError((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal membuat draft pembelian");
      return;
    }

    setDraftNote("");
    setDraftSupplierId("");
    setIsDraftModalOpen(false);
    setMessage("Draft pembelian berhasil dibuat.");
    await loadPurchases();
  }

  if (selectedPurchaseId) {
    return (
      <PurchaseDetail 
        purchaseId={selectedPurchaseId} 
        onBack={() => {
          setSelectedPurchaseId(null);
          loadPurchases();
        }} 
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl font-black uppercase tracking-tighter text-primary">Manajemen Pembelian (PO)</CardTitle>
            <div className="flex items-center gap-2">
                <div className="flex gap-1 p-1 bg-secondary rounded-lg">
                    <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" className="h-8 text-[10px] font-bold uppercase rounded-md" onClick={() => setViewMode('grid')}>Grid</Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" className="h-8 text-[10px] font-bold uppercase rounded-md" onClick={() => setViewMode('list')}>List</Button>
                </div>
                <Button 
                    className="h-10 px-4 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs"
                    onClick={() => {
                        setMessage(null);
                        setError(null);
                        if (filterStoreId) setDraftStoreId(filterStoreId);
                        setIsDraftModalOpen(true);
                    }}
                    disabled={stores.length === 0}
                >
                    Buat PO Baru
                </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_200px_200px_200px_auto_auto]">
            <Input
              className="rounded-xl border-border/60"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Cari nomor PO..."
            />
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
              value={filterStoreId}
              onChange={(event) => setFilterStoreId(event.target.value)}
            >
              <option value="">Semua Store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
              value={filterSupplierId}
              onChange={(event) => setFilterSupplierId(event.target.value)}
            >
              <option value="">Semua Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => loadPurchases()}>
              Cari
            </Button>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => bootstrap()}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground italic">Memuat data pembelian...</p> : null}
          {error ? <p className="text-sm text-red-600 font-medium">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700 font-medium">{message}</p> : null}

          {!loading && filteredPurchases.length === 0 ? (
            <div className="py-20 text-center italic text-muted-foreground">Belum ada transaksi pembelian.</div>
          ) : null}

          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPurchases.map((purchase) => (
                    <button
                        key={purchase.id}
                        onClick={() => setSelectedPurchaseId(purchase.id)}
                        className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-5 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md active:scale-[0.98]"
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">{purchase.stores?.name}</p>
                                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{purchase.purchase_no}</span>
                                </div>
                                <span
                                    className={cn(
                                        "rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-tight",
                                        purchase.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                                        purchase.status === "received" ? "bg-emerald-100 text-emerald-700" :
                                        purchase.status === "cancelled" ? "bg-red-100 text-red-700" :
                                        "bg-blue-100 text-blue-700"
                                    )}
                                >
                                    {purchase.status}
                                </span>
                            </div>
                            
                            <div className="flex flex-col">
                                <p className="text-xs font-bold text-muted-foreground italic">Supplier</p>
                                <p className="text-sm font-black text-foreground">{purchase.suppliers?.name || "TANPA SUPPLIER"}</p>
                            </div>

                            <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-3">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {new Date(purchase.created_at).toLocaleDateString("id-ID")}
                                </span>
                                <span className="text-lg font-black text-primary">
                                    {formatRupiah(Number(purchase.grand_total ?? 0))}
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
                            <th className="px-4 py-3 text-left">No. PO</th>
                            <th className="px-4 py-3 text-left">Tanggal</th>
                            <th className="px-4 py-3 text-left">Store</th>
                            <th className="px-4 py-3 text-left">Supplier</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                        {filteredPurchases.map((purchase) => (
                            <tr 
                                key={purchase.id} 
                                onClick={() => setSelectedPurchaseId(purchase.id)}
                                className="hover:bg-primary/5 transition-colors group cursor-pointer"
                            >
                                <td className="px-4 py-3 font-bold text-primary">{purchase.purchase_no}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{new Date(purchase.created_at).toLocaleDateString("id-ID")}</td>
                                <td className="px-4 py-3 font-medium uppercase text-[10px]">{purchase.stores?.name}</td>
                                <td className="px-4 py-3 font-medium uppercase text-[10px]">{purchase.suppliers?.name || "-"}</td>
                                <td className="px-4 py-3 text-center">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter",
                                        purchase.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                                        purchase.status === "received" ? "bg-emerald-100 text-emerald-700" :
                                        purchase.status === "cancelled" ? "bg-red-100 text-red-700" :
                                        "bg-blue-100 text-blue-700"
                                    )}>
                                        {purchase.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right font-black">{formatRupiah(Number(purchase.grand_total ?? 0))}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isDraftModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsDraftModalOpen(false);
          }}
        >
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Buat Draft Pembelian (PO)</CardTitle>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsDraftModalOpen(false)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </Button>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={createDraftPurchase}>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store / Cabang</label>
                            <select
                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
                                value={draftStoreId}
                                onChange={(event) => setDraftStoreId(event.target.value)}
                                required
                            >
                                {stores.map((store) => (
                                    <option key={store.id} value={store.id}>
                                        {store.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Supplier (Opsional)</label>
                            <select
                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight"
                                value={draftSupplierId}
                                onChange={(event) => setDraftSupplierId(event.target.value)}
                            >
                                <option value="">Tanpa supplier</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Catatan Internal</label>
                        <Input
                            className="rounded-xl"
                            placeholder="Contoh: Stok barang untuk event Lebaran"
                            value={draftNote}
                            onChange={(event) => setDraftNote(event.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <Button type="button" variant="outline" className="rounded-xl font-bold uppercase text-xs" onClick={() => setIsDraftModalOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs">
                            Buat Draft PO
                        </Button>
                    </div>
                </form>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}
