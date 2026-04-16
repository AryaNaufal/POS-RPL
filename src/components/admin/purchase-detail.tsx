"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Purchase } from "@/types/entities/purchase";
import type { PurchaseItem } from "@/types/entities/purchase-item";
import type { Product } from "@/types/entities/product";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type PurchaseWithRelations = Purchase & {
  stores?: { name: string } | null;
  suppliers?: { name: string } | null;
  purchase_items: PurchaseItem[];
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function PurchaseDetail({
  purchaseId,
  onBack,
}: {
  purchaseId: string;
  onBack: () => void;
}) {
  const [purchase, setPurchase] = useState<PurchaseWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReceive, setConfirmReceive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");

  const isDraft = purchase?.status === "draft";

  async function loadPurchase() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as ApiSuccess<PurchaseWithRelations> | ApiError | null;
      if (!response.ok || !body || !("data" in body)) {
        throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat detail pembelian");
      }
      setPurchase(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail pembelian");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPurchase();
  }, [purchaseId]);

  async function searchProducts() {
    if (!searchKeyword.trim()) return;
    try {
      const response = await fetch(`/api/admin/products?keyword=${encodeURIComponent(searchKeyword)}`);
      const body = (await response.json().catch(() => null)) as ApiSuccess<Product[]> | ApiError | null;
      if (response.ok && body && "data" in body) {
        setSearchResults(body.data || []);
      }
    } catch {
      setSearchResults([]);
    }
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!purchase || !isDraft) return;

    const productName = selectedProduct ? selectedProduct.name : searchKeyword;
    if (!productName) {
      setError("Nama produk wajib diisi.");
      return;
    }

    const response = await fetch(`/api/admin/purchases/${purchaseId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedProduct?.id || null,
        productName,
        qty: Number(qty),
        unitCost: Number(unitCost),
        discountAmount: Number(discountAmount),
        taxAmount: Number(taxAmount),
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiError | null;
      setError(body?.message ?? body?.error ?? "Gagal menambah item");
      return;
    }

    setSelectedProduct(null);
    setSearchKeyword("");
    setSearchResults([]);
    setQty("1");
    setUnitCost("0");
    setDiscountAmount("0");
    setTaxAmount("0");
    await loadPurchase();
  }

  async function deleteItem(itemId: string) {
    setActionLoading(true);
    const response = await fetch(`/api/admin/purchases/${purchaseId}/items/${itemId}`, { method: "DELETE" });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiError | null;
      setError(body?.message ?? body?.error ?? "Gagal menghapus item");
    }
    setConfirmDeleteId(null);
    setActionLoading(false);
    await loadPurchase();
  }

  async function receivePurchase() {
    setActionLoading(true);
    const response = await fetch(`/api/admin/purchases/${purchaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "received" }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as ApiError | null;
      setError(body?.message ?? body?.error ?? "Gagal menerima pembelian");
    }

    setConfirmReceive(false);
    setActionLoading(false);
    await loadPurchase();
  }

  if (loading) return <p className="p-4">Memuat...</p>;
  if (!purchase) return <p className="p-4 text-red-600">{error || "Data tidak ditemukan"}</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>Kembali</Button>
          <div>
            <h2 className="text-xl font-bold">{purchase.purchase_no}</h2>
            <p className="text-sm text-muted-foreground">
              {purchase.stores?.name} | {purchase.suppliers?.name || "Tanpa Supplier"} | {purchase.status}
            </p>
          </div>
        </div>
        {isDraft && (
          <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmReceive(true)}>
            Terima Barang (Received)
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
        <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle>Item Pembelian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-secondary/50">
                  <tr>
                    <th className="p-2">Produk</th>
                    <th className="p-2 text-right">Qty</th>
                    <th className="p-2 text-right">Harga Satuan</th>
                    <th className="p-2 text-right">Total</th>
                    {isDraft && <th className="p-2" />}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchase.purchase_items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2">{item.product_name}</td>
                      <td className="p-2 text-right">{item.qty}</td>
                      <td className="p-2 text-right">{formatRupiah(item.unit_cost)}</td>
                      <td className="p-2 text-right font-semibold">{formatRupiah(item.total)}</td>
                      {isDraft && (
                        <td className="p-2 text-right">
                          <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setConfirmDeleteId(item.id)}>
                            Hapus
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatRupiah(purchase.subtotal)}</span></div>
              <div className="flex justify-between text-red-600"><span>Diskon</span><span>-{formatRupiah(purchase.discount_total)}</span></div>
              <div className="flex justify-between"><span>Pajak</span><span>{formatRupiah(purchase.tax_total)}</span></div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg"><span>Total</span><span>{formatRupiah(purchase.grand_total)}</span></div>
            </CardContent>
          </Card>

          {isDraft && (
            <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Tambah Item</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addItem} className="space-y-3">
                  <div className="relative">
                    <Input
                      placeholder="Cari produk..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyUp={(e) => e.key === "Enter" && searchProducts()}
                    />
                    <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1" onClick={searchProducts}>
                      Cari
                    </Button>

                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                            onClick={() => {
                              setSelectedProduct(p);
                              setUnitCost(String(p.buy_price));
                              setSearchResults([]);
                              setSearchKeyword("");
                            }}
                          >
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku} | {formatRupiah(p.buy_price)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-muted-foreground">Qty<Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" /></label>
                    <label className="block text-xs font-medium text-muted-foreground">Harga Beli<Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} min="0" /></label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-muted-foreground">Diskon<Input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} min="0" /></label>
                    <label className="block text-xs font-medium text-muted-foreground">Pajak<Input type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} min="0" /></label>
                  </div>

                  <Button type="submit" className="w-full">Tambah Ke Daftar</Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <ConfirmActionDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Hapus Item"
        description="Apakah Anda yakin ingin menghapus item ini dari daftar pembelian?"
        confirmLabel="Hapus"
        variant="destructive"
        loading={actionLoading}
        onConfirm={() => confirmDeleteId && deleteItem(confirmDeleteId)}
      />

      <ConfirmActionDialog
        open={confirmReceive}
        onOpenChange={setConfirmReceive}
        title="Terima Pembelian"
        description="Status purchase akan berubah menjadi received dan stok akan bertambah satu kali."
        confirmLabel="Terima Barang"
        variant="default"
        loading={actionLoading}
        onConfirm={receivePurchase}
      />
    </div>
  );
}

