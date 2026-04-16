"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ManagementModal } from "@/components/admin/management-modal";
import { ManagementStatusMessage } from "@/components/admin/management-status-message";
import { ManagementEmptyState } from "@/components/admin/management-empty-state";
import { ManagementToolbar } from "@/components/admin/management-toolbar";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { Product } from "@/types/entities/product";
import { CreateProductInput, UpdateProductInput } from "@/types/forms/product-form";
import { ProductCategory } from "@/types/entities/product-category";
import { ProductUnit } from "@/types/entities/product-unit";
import { ApiSuccess, ApiError } from "@/types/common/api";

type ProductWithJoins = Product & {
  product_categories?: { name?: string } | null;
  product_units?: { name?: string; symbol?: string } | null;
};

type FormState = {
  id?: string;
  sku: string;
  name: string;
  categoryId: string;
  unitId: string;
  buyPrice: string;
  sellPrice: string;
  minStock: string;
  trackStock: boolean;
  imageUrl: string;
};

const PLACEHOLDER_IMAGE_URL = "https://placehold.co/600x400";

const initialForm: FormState = {
  sku: "",
  name: "",
  categoryId: "",
  unitId: "",
  buyPrice: "0",
  sellPrice: "0",
  minStock: "0",
  trackStock: true,
  imageUrl: PLACEHOLDER_IMAGE_URL,
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductManagement() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [products, setProducts] = useState<ProductWithJoins[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [productToToggle, setProductToToggle] = useState<ProductWithJoins | null>(null);
  const [toggling, setToggling] = useState(false);

  async function loadOptions() {
    const response = await fetch("/api/admin/product-master/options", { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<{
      categories: ProductCategory[];
      units: ProductUnit[];
    }> | ApiError | null;

    if (!response.ok || !body) {
      throw new Error((body as ApiError)?.message ?? "Gagal memuat opsi produk");
    }

    const data = (body as ApiSuccess<{ categories: ProductCategory[]; units: ProductUnit[] }>).data;
    setCategories(data.categories ?? []);
    setUnits(data.units ?? []);
  }

  async function loadProducts(currentKeyword?: string) {
    const query = currentKeyword?.trim()
      ? `?keyword=${encodeURIComponent(currentKeyword.trim())}`
      : "";
    const response = await fetch(`/api/admin/products${query}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<ProductWithJoins[]> | ApiError | null;

    if (!response.ok) {
      throw new Error((body as ApiError)?.message ?? "Gagal memuat produk");
    }

    setProducts((body as ApiSuccess<ProductWithJoins[]>)?.data ?? []);
  }

  async function bootstrap() {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadOptions(), loadProducts(keyword)]);
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
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setEditingProductId(null);
        setForm(initialForm);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const filteredProducts = useMemo(() => products, [products]);

  async function createProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload: CreateProductInput = {
      sku: form.sku,
      name: form.name,
      category_id: form.categoryId || null,
      unit_id: form.unitId || null,
      buy_price: Number(form.buyPrice),
      sell_price: Number(form.sellPrice),
      min_stock: Number(form.minStock),
      track_stock: form.trackStock,
      is_active: true,
      image_url: form.imageUrl.trim() || PLACEHOLDER_IMAGE_URL,
    };

    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Product> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menambah produk");
      return;
    }

    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Produk berhasil ditambahkan.");
    await loadProducts(keyword);
  }

  function startEditProduct(product: ProductWithJoins) {
    setEditingProductId(product.id);
    setForm({
      id: product.id,
      sku: product.sku,
      name: product.name,
      categoryId: product.category_id ?? "",
      unitId: product.unit_id ?? "",
      buyPrice: String(product.buy_price ?? 0),
      sellPrice: String(product.sell_price ?? 0),
      minStock: String(product.min_stock ?? 0),
      trackStock: product.track_stock,
      imageUrl: product.image_url || PLACEHOLDER_IMAGE_URL,
    });
    setIsModalOpen(true);
  }

  async function submitUpdateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProductId) return;

    setError(null);
    setMessage(null);

    const payload: UpdateProductInput = {
      sku: form.sku,
      name: form.name,
      category_id: form.categoryId || null,
      unit_id: form.unitId || null,
      buy_price: Number(form.buyPrice),
      sell_price: Number(form.sellPrice),
      min_stock: Number(form.minStock),
      track_stock: form.trackStock,
      image_url: form.imageUrl.trim() || PLACEHOLDER_IMAGE_URL,
    };

    const response = await fetch(`/api/admin/products/${editingProductId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Product> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal update produk");
      return;
    }

    setEditingProductId(null);
    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Produk berhasil diperbarui.");
    await loadProducts(keyword);
  }

  async function toggleProductStatus(product: ProductWithJoins) {
    setToggling(true);
    setError(null);
    setMessage(null);
    const payload: UpdateProductInput = { is_active: !product.is_active };

    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Product> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal update status produk");
      setToggling(false);
      setIsConfirmOpen(false);
      return;
    }

    setMessage("Status produk berhasil diubah.");
    setIsConfirmOpen(false);
    setToggling(false);
    await loadProducts(keyword);
  }

  return (
    <section className="flex flex-col gap-4">
        <Card className="card-retail">
        <CardHeader className="space-y-3">
          <ManagementToolbar
            title="Master Katalog Produk"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={() => loadProducts(keyword)}
            onRefresh={bootstrap}
            actionLabel="Tambah Produk"
            onAction={() => {
              setEditingProductId(null);
              setForm(initialForm);
              setIsModalOpen(true);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            placeholder="Cari nama / SKU produk..."
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <ManagementStatusMessage type="loading">Memuat data...</ManagementStatusMessage> : null}
          {error ? <ManagementStatusMessage type="error">{error}</ManagementStatusMessage> : null}
          {message ? <ManagementStatusMessage type="success">{message}</ManagementStatusMessage> : null}

          {!loading && filteredProducts.length === 0 ? (
            <ManagementEmptyState title="Belum ada produk." />
          ) : null}

          {viewMode === 'list' ? (
              <div className="space-y-2">
                  {filteredProducts.map((product) => (
                      <div key={product.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                          <div className="grid gap-4 sm:grid-cols-[64px_1fr_auto]">
                              <img
                                  src={product.image_url || PLACEHOLDER_IMAGE_URL}
                                  alt={product.name}
                                  className="h-16 w-16 rounded-xl border border-border/40 object-cover"
                              />
                              <div className="min-w-0 flex flex-col justify-center">
                                  <p className="truncate text-sm font-black text-foreground uppercase tracking-tight">
                                      {product.name}
                                  </p>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                      {product.sku} | {product.product_categories?.name || "UMUM"}
                                  </p>
                                  <p className="mt-1 text-xs font-black text-primary uppercase">
                                      {formatRupiah(Number(product.sell_price ?? 0))}
                                  </p>
                              </div>
                              <div className="flex items-center gap-2">
                                  <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase text-primary hover:bg-primary/5" onClick={() => startEditProduct(product)}>Edit</Button>
                                  <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className={cn("h-8 text-[10px] font-bold uppercase", product.is_active ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50")} 
                                      onClick={() => {
                                          setProductToToggle(product);
                                          setIsConfirmOpen(true);
                                      }}
                                  >
                                      {product.is_active ? "Off" : "On"}
                                  </Button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {filteredProducts.map((product) => (
                      <div key={product.id} className="group flex flex-col rounded-2xl border border-border/50 bg-white overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                          <div className="relative aspect-square overflow-hidden bg-secondary/20">
                              <img
                                  src={product.image_url || PLACEHOLDER_IMAGE_URL}
                                  alt={product.name}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                              />
                              {!product.is_active && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">Nonaktif</span>
                                  </div>
                              )}
                          </div>
                          <div className="p-4 flex flex-col gap-1 flex-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{product.sku}</p>
                              <h3 className="text-xs font-black text-foreground uppercase tracking-tight line-clamp-2 h-8 leading-tight">{product.name}</h3>
                              <div className="mt-auto pt-2 flex items-center justify-between">
                                  <p className="text-sm font-black text-primary">{formatRupiah(Number(product.sell_price))}</p>
                                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full text-primary" onClick={() => startEditProduct(product)}>
                                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                      </Button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
        </CardContent>
      </Card>

      <ManagementModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setEditingProductId(null);
            setForm(initialForm);
          }
        }}
      >
            <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">
                        {editingProductId ? "Edit Produk" : "Tambah Produk Baru"}
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => {
                            setIsModalOpen(false);
                            setEditingProductId(null);
                            setForm(initialForm);
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={editingProductId ? submitUpdateProduct : createProduct}>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Informasi Dasar</label>
                            <div className="grid gap-2">
                                <Input
                                    className="rounded-xl"
                                    placeholder="SKU (Barcode)"
                                    value={form.sku}
                                    onChange={(event) => setForm((c) => ({ ...c, sku: event.target.value }))}
                                    required
                                />
                                <Input
                                    className="rounded-xl"
                                    placeholder="Nama Produk Lengkap"
                                    value={form.name}
                                    onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kategori</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
                                    value={form.categoryId}
                                    onChange={(event) => setForm((c) => ({ ...c, categoryId: event.target.value }))}
                                >
                                    <option value="">Pilih Kategori</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Satuan</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
                                    value={form.unitId}
                                    onChange={(event) => setForm((c) => ({ ...c, unitId: event.target.value }))}
                                >
                                    <option value="">Pilih Satuan</option>
                                    {units.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Harga & Stok</label>
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Beli</span>
                                    <Input
                                        className="rounded-xl"
                                        type="number"
                                        min={0}
                                        value={form.buyPrice}
                                        onChange={(event) => setForm((c) => ({ ...c, buyPrice: event.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Jual</span>
                                    <Input
                                        className="rounded-xl"
                                        type="number"
                                        min={0}
                                        value={form.sellPrice}
                                        onChange={(event) => setForm((c) => ({ ...c, sellPrice: event.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Min Stok</span>
                                    <Input
                                        className="rounded-xl"
                                        type="number"
                                        min={0}
                                        value={form.minStock}
                                        onChange={(event) => setForm((c) => ({ ...c, minStock: event.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-1">
                            <input
                                type="checkbox"
                                id="trackStock"
                                checked={form.trackStock}
                                onChange={(event) => setForm((c) => ({ ...c, trackStock: event.target.checked }))}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <label htmlFor="trackStock" className="text-xs font-bold uppercase text-muted-foreground cursor-pointer">Pantau Stok Otomatis</label>
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visual Produk (URL)</label>
                            <Input
                                className="rounded-xl"
                                type="url"
                                placeholder="https://..."
                                value={form.imageUrl}
                                onChange={(event) => setForm((c) => ({ ...c, imageUrl: event.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="rounded-xl font-bold uppercase text-xs"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingProductId(null);
                                    setForm(initialForm);
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs">
                                {editingProductId ? "Simpan Perubahan" : "Simpan Produk"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
      </ManagementModal>

      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={productToToggle?.is_active ? "Nonaktifkan Produk" : "Aktifkan Produk"}
        description={productToToggle?.is_active 
            ? `Apakah Anda yakin ingin menonaktifkan ${productToToggle.name}? Produk yang nonaktif tidak akan muncul di kasir.` 
            : `Apakah Anda yakin ingin mengaktifkan kembali ${productToToggle?.name}?`}
        confirmLabel={productToToggle?.is_active ? "Nonaktifkan" : "Aktifkan"}
        variant={productToToggle?.is_active ? "destructive" : "default"}
        loading={toggling}
        onConfirm={() => productToToggle && toggleProductStatus(productToToggle)}
      />
    </section>
  );
}

