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
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Form for adding item
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");
  const [unitCost, setUnitCost] = useState("0");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [taxAmount, setTaxAmount] = useState("0");

  async function loadPurchase() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as ApiSuccess<PurchaseWithRelations> | ApiError | null;
      if (!response.ok || !body || !("data" in body)) {
        throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat detail pembelian");
      }
      setPurchase(body.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchase();
  }, [purchaseId]);

  async function searchProducts() {
    if (!searchKeyword.trim()) return;
    try {
      const response = await fetch(`/api/admin/products?keyword=${encodeURIComponent(searchKeyword)}`);
      const body = (await response.json().catch(() => null)) as ApiSuccess<Product[]> | ApiError | null;
      if (response.ok && body && "data" in body) {
        setSearchResults(body.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleSelectProduct(product: Product) {
    setSelectedProduct(product);
    setUnitCost(String(product.buy_price));
    setSearchResults([]);
    setSearchKeyword("");
  }

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!purchase) return;
    setError(null);

    const productName = selectedProduct ? selectedProduct.name : searchKeyword;
    if (!productName) {
        setError("Nama produk atau pilihan produk wajib diisi.");
        return;
    }

    try {
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
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Gagal menambah item");
      
      // Reset form and reload
      setSelectedProduct(null);
      setQty("1");
      setUnitCost("0");
      setDiscountAmount("0");
      setTaxAmount("0");
      loadPurchase();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteItem(itemId: string) {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Gagal menghapus item");
      }
      setConfirmDeleteId(null);
      loadPurchase();
    } catch (err: any) {
      setError(err.message);
      setConfirmDeleteId(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function updateStatus(newStatus: string) {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Gagal update status");
      }
      setConfirmStatus(null);
      loadPurchase();
    } catch (err: any) {
      setError(err.message);
      setConfirmStatus(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturn(itemId: string, maxQty: number) {
    const qty = prompt(`Masukkan jumlah yang akan diretur ke supplier (Maksimal ${maxQty}):`, "1");
    if (!qty) return;
    const numQty = Number(qty);
    if (isNaN(numQty) || numQty <= 0 || numQty > maxQty) {
      alert("Jumlah retur tidak valid.");
      return;
    }
    const reason = prompt("Alasan retur ke supplier:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/purchases/${purchaseId}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, qty: numQty, reason }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Gagal memproses retur");
      }
      loadPurchase();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <p className="p-4">Memuat...</p>;
  if (!purchase) return <p className="p-4 text-red-600">{error || "Data tidak ditemukan"}</p>;

  const isDraft = purchase.status === "draft";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            Kembali
          </Button>
          <div>
            <h2 className="text-xl font-bold">{purchase.purchase_no}</h2>
            <p className="text-sm text-muted-foreground">
              {purchase.stores?.name} | {purchase.suppliers?.name || "Tanpa Supplier"} | {purchase.status}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <>
              <Button variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => setConfirmStatus("ordered")}>
                Pesan (Ordered)
              </Button>
              <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmStatus("received")}>
                Terima Barang (Received)
              </Button>
            </>
          )}
          {purchase.status === "ordered" && (
            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmStatus("received")}>
              Terima Barang (Received)
            </Button>
          )}
          {(isDraft || purchase.status === "ordered") && (
            <Button variant="destructive" onClick={() => setConfirmStatus("cancelled")}>
              Batalkan
            </Button>
          )}
        </div>
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
                    <th className="p-2 text-right text-red-600">Retur</th>
                    <th className="p-2 text-right">Harga Satuan</th>
                    <th className="p-2 text-right">Total</th>
                    {(isDraft || purchase.status === "received") && <th className="p-2"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {purchase.purchase_items.map((item: PurchaseItem) => (
                    <tr key={item.id}>
                      <td className="p-2">{item.product_name}</td>
                      <td className="p-2 text-right">{item.qty}</td>
                      <td className="p-2 text-right text-red-600 font-bold">{item.return_qty || 0}</td>
                      <td className="p-2 text-right">{formatRupiah(item.unit_cost)}</td>
                      <td className="p-2 text-right font-semibold">{formatRupiah(item.total)}</td>
                      <td className="p-2 text-right">
                        {isDraft && (
                          <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600" 
                              onClick={() => setConfirmDeleteId(item.id)}
                          >
                            Hapus
                          </Button>
                        )}
                        {purchase.status === "received" && (Number(item.qty) - Number(item.return_qty || 0) > 0) && (
                          <Button size="sm" variant="outline" className="text-orange-600 h-7 text-[10px]" onClick={() => handleReturn(item.id, Number(item.qty) - Number(item.return_qty || 0))}>
                            Retur
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {purchase.purchase_items.length === 0 && (
                    <tr>
                      <td colSpan={isDraft ? 5 : 4} className="p-4 text-center text-muted-foreground">
                        Belum ada item.
                      </td>
                    </tr>
                  )}
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
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(purchase.subtotal)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Diskon</span>
                <span>-{formatRupiah(purchase.discount_total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak</span>
                <span>{formatRupiah(purchase.tax_total)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatRupiah(purchase.grand_total)}</span>
              </div>
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
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-1 top-1"
                        onClick={searchProducts}
                    >
                        Cari
                    </Button>
                    
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left p-2 hover:bg-gray-100 text-sm"
                            onClick={() => handleSelectProduct(p)}
                          >
                            <p className="font-semibold">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sku} | {formatRupiah(p.buy_price)}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedProduct && (
                    <div className="p-2 bg-blue-50 rounded-md text-sm border border-blue-200">
                      Terpilih: <strong>{selectedProduct.name}</strong>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="ml-2 h-6 px-2">Batal</Button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Qty
                      <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" />
                    </label>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Harga Beli
                      <Input type="number" value={unitCost} onChange={(e) => setUnitCost(e.target.value)} min="0" />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Diskon
                      <Input type="number" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} min="0" />
                    </label>
                    <label className="block text-xs font-medium text-muted-foreground">
                      Pajak
                      <Input type="number" value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} min="0" />
                    </label>
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
        open={!!confirmStatus}
        onOpenChange={(open) => !open && setConfirmStatus(null)}
        title={`${confirmStatus === "ordered" ? "Pesan" : confirmStatus === "received" ? "Terima" : "Batalkan"} Pembelian`}
        description={`Apakah Anda yakin ingin mengubah status pembelian ini menjadi ${confirmStatus?.toUpperCase()}?`}
        confirmLabel={confirmStatus === "ordered" ? "Pesan" : confirmStatus === "received" ? "Terima Barang" : "Batalkan"}
        variant={confirmStatus === "cancelled" ? "destructive" : "default"}
        loading={actionLoading}
        onConfirm={() => confirmStatus && updateStatus(confirmStatus)}
      />
    </div>
  );
}
