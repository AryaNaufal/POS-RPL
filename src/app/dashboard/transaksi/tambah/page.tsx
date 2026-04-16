"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Customer } from "@/types/entities/customer";
import type { Product } from "@/types/entities/product";
import type { PaymentMethod } from "@/types/common/enums";
import type { CreateSaleInput, CreateSaleItemInput } from "@/types/forms/sale-form";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type PaymentMethodOption = {
  value: string;
  label: string;
};

type LineItem = {
  id: number;
  product_id: string;
  qty: number;
};

const initialItems: LineItem[] = [{ id: 1, product_id: "", qty: 1 }];

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TambahTransaksiPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<LineItem[]>(initialItems);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  const subTotal = useMemo(
    () =>
      items.reduce((total, item) => {
        const product = productMap.get(item.product_id);
        if (!product) return total;
        return total + Number(product.sell_price ?? 0) * item.qty;
      }, 0),
    [items, productMap]
  );
  const grandTotal = subTotal;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/kasir/transaction-options", {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => null)) as ApiSuccess<{
          activeStore?: { id?: string; name?: string };
          customers?: Customer[];
          products?: Product[];
          paymentMethods?: PaymentMethodOption[];
        }> | ApiError | null;

        if (!response.ok || !body || !("data" in body) || !body.data.activeStore?.id) {
          throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal memuat opsi transaksi.");
        }

        setStoreId(body.data.activeStore.id);
        setStoreName(body.data.activeStore.name ?? "-");
        setCustomers(body.data.customers ?? []);
        setProducts(body.data.products ?? []);
        const methods = body.data.paymentMethods ?? [];
        setPaymentMethods(methods);
        if (methods.length > 0) {
            setPaymentMethod(methods[0].value as PaymentMethod);
        }
      } catch (err: any) {
        setError(err?.message ?? "Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function addItem() {
    const nextId = (items.at(-1)?.id ?? 0) + 1;
    setItems((current) => [...current, { id: nextId, product_id: "", qty: 1 }]);
  }

  function removeItem(id: number) {
    setItems((current) => (current.length === 1 ? current : current.filter((item) => item.id !== id)));
  }

  function updateItem(id: number, key: "product_id" | "qty", value: string) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        if (key === "product_id") return { ...item, product_id: value };
        return { ...item, qty: Math.max(1, Number(value) || 1) };
      })
    );
  }

  async function handleSubmit(event: React.FormEvent, status: "completed" | "draft" = "completed") {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const invalidItem = items.find((item) => !item.product_id || item.qty <= 0);
    if (invalidItem) {
      setError("Semua item harus memilih produk dan qty lebih dari 0.");
      return;
    }

    if (!storeId) {
      setError("Store aktif tidak ditemukan.");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateSaleInput = {
        store_id: storeId,
        customer_id: customerId || null,
        items: items.map((item) => {
          const product = productMap.get(item.product_id);
          return {
            product_id: item.product_id,
            qty: item.qty,
            unit_price: product?.sell_price ?? 0,
            discount_amount: 0,
          };
        }),
        payments: status === "completed" ? [
          {
            payment_method: paymentMethod,
            amount: grandTotal,
          }
        ] : [],
        discount_total: 0,
        tax_total: 0,
        service_total: 0,
        status,
        note: note.trim() || null,
      };

      const response = await fetch("/api/kasir/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as ApiSuccess<{ invoiceNo: string }> | ApiError | null;

      if (!response.ok || !body || !("data" in body)) {
        throw new Error((body as ApiError)?.message ?? (body as ApiError)?.error ?? "Gagal menyimpan transaksi.");
      }

      setMessage(`Transaksi ${status === "draft" ? "draft " : ""}berhasil disimpan. Invoice: ${body.data.invoiceNo}`);
      setItems(initialItems);
      setCustomerId("");
      setNote("");
    } catch (err: any) {
      setError(err?.message ?? "Terjadi kesalahan saat simpan transaksi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf8_0%,#edf5f1_100%)] px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <header className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Transaksi Baru
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-foreground">Form Tambah Transaksi</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Input transaksi kasir langsung ke database. Store aktif: {storeName || "-"}.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/kasir">Kembali ke Kasir</Link>
            </Button>
          </div>
        </header>

        <form className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" onSubmit={(e) => handleSubmit(e, "completed")}>
          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Detail Transaksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? <p className="text-sm text-muted-foreground">Memuat opsi transaksi...</p> : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer">Pelanggan</Label>
                  <select
                    id="customer"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    disabled={loading || saving}
                  >
                    <option value="">Walk-in</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.code ? ` (${customer.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
                  <select
                    id="paymentMethod"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                    disabled={loading || saving}
                    required
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Item Transaksi</Label>
                  <Button type="button" variant="outline" onClick={addItem} disabled={loading || saving}>
                    Tambah Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.map((item) => {
                    const selectedProduct = productMap.get(item.product_id);
                    return (
                      <div
                        key={item.id}
                        className="grid gap-2 rounded-xl border border-border/70 bg-secondary/40 p-3 sm:grid-cols-[1fr_90px_140px_auto]"
                      >
                        <select
                          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                          value={item.product_id}
                          onChange={(event) => updateItem(item.id, "product_id", event.target.value)}
                          disabled={loading || saving}
                          required
                        >
                          <option value="">Pilih produk</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(event) => updateItem(item.id, "qty", event.target.value)}
                          required
                          disabled={loading || saving}
                        />
                        <div className="flex items-center rounded-md border border-input bg-background px-3 text-sm">
                          {formatRupiah(Number(selectedProduct?.sell_price ?? 0))}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          className="h-10"
                          disabled={saving}
                        >
                          Hapus
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Catatan</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Catatan transaksi (opsional)"
                  disabled={saving}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Bayar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatRupiah(subTotal)}</span>
              </div>
              <div className="h-px bg-border/70" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-semibold text-foreground">{formatRupiah(grandTotal)}</span>
              </div>

              <div className="flex flex-col gap-2">
                <Button type="submit" size="lg" className="mt-3 w-full" disabled={loading || saving}>
                  {saving ? "Menyimpan..." : "Bayar Sekarang (Lengkap)"}
                </Button>
                <Button 
                    type="button" 
                    variant="outline" 
                    size="lg" 
                    className="w-full" 
                    disabled={loading || saving}
                    onClick={(e) => handleSubmit(e, "draft")}
                >
                  Simpan Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  );
}
