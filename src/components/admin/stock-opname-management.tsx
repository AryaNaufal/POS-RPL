"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Store } from "@/types/entities/store";
import type { StockOpname } from "@/types/entities/stock-opname";
import type { Product } from "@/types/entities/product";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type StockOpnameWithRelations = StockOpname & {
  stores?: { name: string } | null;
};

type OpnameItemInput = {
  productId: string;
  name: string;
  sku: string;
  qtyExpected: number;
  qtyActual: number | string;
};

export function StockOpnameManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [opnames, setOpnames] = useState<StockOpnameWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState("");
  const [opnameItems, setOpnameItems] = useState<OpnameItemInput[]>([]);
  const [isCreating, setIsIsCreating] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [opnameToComplete, setOpnameToComplete] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  async function loadOptions() {
    const response = await fetch("/api/admin/product-master/options", { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<{ stores: Store[] }> | ApiError | null;
    if (response.ok && body && "data" in body) {
      setStores(body.data.stores || []);
      if (body.data.stores?.length > 0) setStoreId(body.data.stores[0].id);
    }
  }

  async function loadOpnames() {
    setLoading(true);
    const response = await fetch("/api/admin/inventory/opnames", { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<StockOpnameWithRelations[]> | ApiError | null;
    if (response.ok && body && "data" in body) {
        setOpnames(body.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOptions();
    loadOpnames();
  }, []);

  async function startNewOpname() {
    if (!storeId) return;
    setLoading(true);
    const response = await fetch(`/api/admin/inventory/stocks?storeId=${storeId}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<any[]> | ApiError | null;
    if (response.ok && body && "data" in body) {
      const items = body.data.map((s: any) => ({
        productId: s.products.id,
        name: s.products.name,
        sku: s.products.sku,
        qtyExpected: s.qty_on_hand,
        qtyActual: s.qty_on_hand,
      }));
      setOpnameItems(items);
      setIsIsCreating(true);
    }
    setLoading(false);
  }

  async function submitOpname() {
    try {
      const response = await fetch("/api/admin/inventory/opnames", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, items: opnameItems }),
      });
      if (response.ok) {
        setIsIsCreating(false);
        loadOpnames();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function completeOpname(id: string) {
    setCompleting(true);
    const response = await fetch(`/api/admin/inventory/opnames/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    if (response.ok) {
        setIsConfirmOpen(false);
        loadOpnames();
    }
    setCompleting(false);
  }

  if (isCreating) {
    return (
      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Sesi Stock Opname Baru</CardTitle>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsIsCreating(false)}>Batal</Button>
            <Button onClick={submitOpname}>Simpan Sesi (Draft)</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 border-b">
                <tr className="text-left">
                  <th className="p-2">Produk</th>
                  <th className="p-2 text-right">Ekspektasi</th>
                  <th className="p-2 text-right">Fisik (Aktual)</th>
                  <th className="p-2 text-right">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {opnameItems.map((item, idx) => (
                  <tr key={item.productId}>
                    <td className="p-2">{item.name} ({item.sku})</td>
                    <td className="p-2 text-right">{item.qtyExpected}</td>
                    <td className="p-2 text-right">
                      <Input 
                        type="number" 
                        value={item.qtyActual} 
                        onChange={(e) => {
                          const newItems = [...opnameItems];
                          newItems[idx].qtyActual = e.target.value;
                          setOpnameItems(newItems);
                        }}
                        className="w-24 ml-auto text-right h-8"
                      />
                    </td>
                    <td className={`p-2 text-right font-bold ${Number(item.qtyActual) - Number(item.qtyExpected) !== 0 ? 'text-red-600' : ''}`}>
                      {Number(item.qtyActual) - Number(item.qtyExpected)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader><CardTitle>Histori Stock Opname</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr className="text-left">
                <th className="pb-2">No. Sesi</th>
                <th className="pb-2">Store</th>
                <th className="pb-2">Waktu</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {opnames.map((o) => (
                <tr key={o.id}>
                  <td className="py-2 font-medium">{o.opname_no}</td>
                  <td className="py-2">{o.stores?.name}</td>
                  <td className="py-2 text-[10px]">{new Date(o.created_at).toLocaleString("id-ID")}</td>
                  <td className="py-2 uppercase font-bold text-[10px]">{o.status}</td>
                  <td className="py-2 text-right">
                    {o.status === "draft" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-[10px] bg-emerald-50 text-emerald-700" 
                        onClick={() => {
                            setOpnameToComplete(o.id);
                            setIsConfirmOpen(true);
                        }}
                      >
                        Finalisasi
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
        title="Finalisasi Stock Opname"
        description="Apakah Anda yakin ingin menyelesaikan sesi stock opname ini? Stok di sistem akan diperbarui sesuai dengan jumlah fisik yang Anda input."
        confirmLabel="Selesaikan"
        loading={completing}
        onConfirm={() => opnameToComplete && completeOpname(opnameToComplete)}
      />

      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm h-fit">
        <CardHeader><CardTitle>Mulai Opname Baru</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Pilih Store
            <select className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={startNewOpname} disabled={!storeId || loading}>Tarik Data Stok & Mulai</Button>
        </CardContent>
      </Card>
    </div>
  );
}
