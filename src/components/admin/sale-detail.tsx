"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Sale } from "@/types/entities/sale";
import type { SaleItem } from "@/types/entities/sale-item";
import type { SalePayment } from "@/types/entities/sale-payment";
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

  async function loadSale() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/sales/${saleId}`, { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as ApiSuccess<SaleWithRelations> | ApiError | null;
      if (!response.ok || !body || !("data" in body)) {
        throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat detail penjualan");
      }
      setSale(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail penjualan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSale();
  }, [saleId]);

  if (loading) return <p className="p-4">Memuat...</p>;
  if (!sale) return <p className="p-4 text-red-600">{error || "Data tidak ditemukan"}</p>;

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
                      <th className="p-2 text-right">Harga Satuan</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sale.sale_items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.sku_snapshot}</p>
                        </td>
                        <td className="p-2 text-right">{item.qty}</td>
                        <td className="p-2 text-right">{formatRupiah(item.unit_price)}</td>
                        <td className="p-2 text-right font-semibold">{formatRupiah(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {sale.sale_payments.length > 0 && (
            <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
              <CardHeader>
                <CardTitle>Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sale.sale_payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                      <div>
                        <p className="font-bold uppercase text-emerald-800">{payment.payment_method}</p>
                        <p className="text-xs text-muted-foreground">{new Date(payment.paid_at).toLocaleString("id-ID")}</p>
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
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

