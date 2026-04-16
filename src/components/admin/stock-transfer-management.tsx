"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Store } from "@/types/entities/store";
import type { Product } from "@/types/entities/product";
import type { StockTransfer } from "@/types/entities/stock-transfer";
import type { StockTransferStatus } from "@/types/common/enums";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type StockTransferWithRelations = StockTransfer & {
  from_store?: { name: string } | null;
  to_store?: { name: string } | null;
};

export function StockTransferManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transfers, setTransfers] = useState<StockTransferWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromStoreId, setFromStoreId] = useState("");
  const [toStoreId, setToStoreId] = useState("");
  const [items, setItems] = useState<{ productId: string; qty: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{id: string, status: StockTransferStatus} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadOptions() {
    const response = await fetch("/api/admin/product-master/options", { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<{ stores: Store[] }> | ApiError | null;
    if (response.ok && body && "data" in body) {
      setStores(body.data.stores || []);
      if (body.data.stores?.length > 0) {
        setFromStoreId(body.data.stores[0].id);
        setToStoreId(body.data.stores[1]?.id || "");
      }
    }
    const productsRes = await fetch("/api/admin/products", { cache: "no-store" });
    const productsBody = (await productsRes.json().catch(() => null)) as ApiSuccess<Product[]> | ApiError | null;
    if (productsRes.ok && productsBody && "data" in productsBody) {
        setProducts(productsBody.data || []);
    }
  }

  async function loadTransfers() {
    setLoading(true);
    const response = await fetch("/api/admin/inventory/transfers", { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<StockTransferWithRelations[]> | ApiError | null;
    if (response.ok && body && "data" in body) {
        setTransfers(body.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOptions();
    loadTransfers();
  }, []);

  function addItem() {
    if (!selectedProductId || Number(qty) <= 0) return;
    setItems([...items, { productId: selectedProductId, qty: Number(qty) }]);
    setSelectedProductId("");
    setQty("1");
  }

  async function submitTransfer() {
    if (!fromStoreId || !toStoreId || items.length === 0) return;
    try {
      const response = await fetch("/api/admin/inventory/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStoreId, toStoreId, items }),
      });
      if (response.ok) {
        setItems([]);
        loadTransfers();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function updateStatus(transferId: string, status: StockTransferStatus) {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/inventory/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setIsConfirmOpen(false);
        loadTransfers();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Histori Transfer Stok</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2">No. Transfer</th>
                <th className="pb-2">Dari</th>
                <th className="pb-2">Ke</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading && <tr><td colSpan={5} className="py-4 text-center">Memuat...</td></tr>}
              {transfers.map((t) => (
                <tr key={t.id}>
                  <td className="py-2 font-medium">{t.transfer_no}</td>
                  <td className="py-2">{t.from_store?.name}</td>
                  <td className="py-2">{t.to_store?.name}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary">
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2 text-right space-x-1">
                    {t.status === "draft" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-[10px]" 
                        onClick={() => {
                            setConfirmData({ id: t.id, status: "shipped" });
                            setIsConfirmOpen(true);
                        }}
                      >
                        Kirim
                      </Button>
                    )}
                    {t.status === "shipped" && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700" 
                        onClick={() => {
                            setConfirmData({ id: t.id, status: "received" });
                            setIsConfirmOpen(true);
                        }}
                      >
                        Terima
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={confirmData?.status === "shipped" ? "Kirim Transfer Stok" : "Terima Transfer Stok"}
        description={confirmData?.status === "shipped" 
            ? "Apakah Anda yakin ingin mengirim transfer stok ini? Stok di store asal akan berkurang." 
            : "Apakah Anda yakin ingin menerima transfer stok ini? Stok di store tujuan akan bertambah."}
        confirmLabel={confirmData?.status === "shipped" ? "Kirim Sekarang" : "Terima Sekarang"}
        loading={actionLoading}
        onConfirm={() => confirmData && updateStatus(confirmData.id, confirmData.status)}
      />

      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Buat Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Dari Store
            <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={fromStoreId} onChange={(e) => setFromStoreId(e.target.value)}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Ke Store
            <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={toStoreId} onChange={(e) => setToStoreId(e.target.value)}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>

          <div className="border-t pt-3 space-y-2">
            <p className="text-xs font-bold uppercase text-muted-foreground">Tambah Item</p>
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)}>
              <option value="">Pilih produk</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
            <div className="flex gap-2">
              <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" className="w-20" />
              <Button variant="outline" className="flex-1" onClick={addItem}>Tambah Item</Button>
            </div>
          </div>

          <div className="space-y-1">
            {items.map((item, idx) => {
              const p = products.find(prod => prod.id === item.productId);
              return (
                <div key={idx} className="flex justify-between text-xs p-2 bg-secondary/30 rounded">
                  <span>{p?.name}</span>
                  <span className="font-bold">x{item.qty}</span>
                </div>
              );
            })}
          </div>

          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={submitTransfer} disabled={items.length === 0}>Simpan Draft Transfer</Button>
        </CardContent>
      </Card>
    </div>
  );
}

