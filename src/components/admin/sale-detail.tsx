"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Sale } from "@/types/entities/sale";
import type { SaleItem } from "@/types/entities/sale-item";
import type { SalePayment } from "@/types/entities/sale-payment";
import type { Product } from "@/types/entities/product";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type SaleWithRelations = Sale & {
  stores?: { name: string } | null;
  customers?: { name: string } | null;
  cashier?: { name: string; email: string } | null;
  sale_items: SaleItem[];
  sale_payments: SalePayment[];
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SaleDetail({
  saleId,
  onBack,
}: {
  saleId: string;
  onBack: () => void;
}) {
  const [sale, setSale] = useState<SaleWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form for adding item (only for draft)
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");

  async function loadSale() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/sales/${saleId}`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as ApiSuccess<SaleWithRelations> | ApiError | null;
      if (!response.ok || !body || !("data" in body)) {
        throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat detail penjualan");
      }
      setSale(body.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSale();
  }, [saleId]);

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

  async function addItem(event: React.FormEvent) {
    event.preventDefault();
    if (!sale || !selectedProduct) return;
    try {
      const response = await fetch(`/api/admin/sales/${saleId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          qty: Number(qty),
        }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Gagal menambah item");
      }
      setSelectedProduct(null);
      setQty("1");
      setSearchKeyword("");
      loadSale();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteItem(itemId: string) {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/sales/${saleId}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Gagal menghapus item");
      }
      setConfirmDeleteId(null);
      loadSale();
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
      const response = await fetch(`/api/admin/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Gagal update status");
      setConfirmStatus(null);
      loadSale();
    } catch (err: any) {
      setError(err.message);
      setConfirmStatus(null);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReturn(itemId: string, maxQty: number) {
    const qty = prompt(`Masukkan jumlah yang akan diretur (Maksimal ${maxQty}):`, "1");
    if (!qty) return;
    const numQty = Number(qty);
    if (isNaN(numQty) || numQty <= 0 || numQty > maxQty) {
      alert("Jumlah retur tidak valid.");
      return;
    }
    const reason = prompt("Alasan retur:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/sales/${saleId}/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, qty: numQty, reason }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Gagal memproses retur");
      }
      loadSale();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <p className="p-4">Memuat...</p>;
  if (!sale) return <p className="p-4 text-red-600">{error || "Data tidak ditemukan"}</p>;

  const isDraft = sale.status === "draft";
  const canVoidRefund = sale.status === "completed";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            Kembali
          </Button>
          <div>
            <h2 className="text-xl font-bold">{sale.invoice_no}</h2>
            <p className="text-sm text-muted-foreground">
              {sale.stores?.name} | {sale.customers?.name || "Walk-in"} | {sale.status}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isDraft && (
            <Button variant="default" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmStatus("completed")}>
              Finalisasi (Complete)
            </Button>
          )}
          {canVoidRefund && (
            <>
              <Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => setConfirmStatus("void")}>
                Void
              </Button>
              <Button variant="outline" className="text-orange-600 hover:bg-orange-50" onClick={() => setConfirmStatus("refunded")}>
                Refund
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_350px]">
        <div className="flex flex-col gap-4">
          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Item Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-secondary/50">
                    <tr>
                      <th className="p-2">Produk</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Retur</th>
                      <th className="p-2 text-right">Harga Satuan</th>
                      <th className="p-2 text-right">Total</th>
                      {(isDraft || canVoidRefund) && <th className="p-2"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sale.sale_items.map((item: SaleItem) => (
                      <tr key={item.id}>
                        <td className="p-2">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku_snapshot}</p>
                        </td>
                        <td className="p-2 text-right">{item.qty}</td>
                        <td className="p-2 text-right text-red-600 font-bold">{item.return_qty || 0}</td>
                        <td className="p-2 text-right">{formatRupiah(item.unit_price)}</td>
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
                          {canVoidRefund && (Number(item.qty) - Number(item.return_qty || 0) > 0) && (
                            <Button size="sm" variant="outline" className="text-orange-600 h-7 text-[10px]" onClick={() => handleReturn(item.id, Number(item.qty) - Number(item.return_qty || 0))}>
                              Retur
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sale.sale_items.length === 0 && (
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

          {sale.sale_payments.length > 0 && (
            <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Histori Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sale.sale_payments.map((payment: SalePayment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="font-bold uppercase text-emerald-800">{payment.payment_method}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.paid_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                      <span className="font-bold">{formatRupiah(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Info Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Kasir</p>
                <p className="text-sm font-medium">{sale.cashier?.name} ({sale.cashier?.email})</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Waktu</p>
                <p className="text-sm font-medium">{new Date(sale.sold_at).toLocaleString("id-ID")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Catatan</p>
                <p className="text-sm italic">{sale.note || "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle>Ringkasan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Diskon</span>
                <span>-{formatRupiah(sale.discount_total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak</span>
                <span>{formatRupiah(sale.tax_total)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatRupiah(sale.grand_total)}</span>
              </div>
            </CardContent>
          </Card>

          {isDraft && (
            <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Tambah Item (Draft)</CardTitle>
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
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-auto">
                        {searchResults.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left p-2 hover:bg-gray-100 text-xs"
                            onClick={() => {
                              setSelectedProduct(p);
                              setSearchResults([]);
                              setSearchKeyword("");
                            }}
                          >
                            {p.name} ({formatRupiah(p.sell_price)})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedProduct && (
                    <p className="text-xs font-semibold text-emerald-700">Terpilih: {selectedProduct.name}</p>
                  )}
                  <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} min="1" placeholder="Qty" />
                  <Button type="submit" className="w-full" disabled={!selectedProduct}>Tambah</Button>
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
        description="Apakah Anda yakin ingin menghapus item ini dari transaksi?"
        confirmLabel="Hapus"
        variant="destructive"
        loading={actionLoading}
        onConfirm={() => confirmDeleteId && deleteItem(confirmDeleteId)}
      />

      <ConfirmActionDialog
        open={!!confirmStatus}
        onOpenChange={(open) => !open && setConfirmStatus(null)}
        title={`${confirmStatus === "completed" ? "Finalisasi" : confirmStatus === "void" ? "Void" : "Refund"} Transaksi`}
        description={`Apakah Anda yakin ingin mengubah status transaksi ini menjadi ${confirmStatus?.toUpperCase()}? Aksi ini akan berdampak pada stok dan laporan keuangan.`}
        confirmLabel={confirmStatus === "completed" ? "Finalisasi" : confirmStatus === "void" ? "Void" : "Refund"}
        variant={confirmStatus === "completed" ? "default" : "destructive"}
        loading={actionLoading}
        onConfirm={() => confirmStatus && updateStatus(confirmStatus)}
      />
    </div>
  );
}
