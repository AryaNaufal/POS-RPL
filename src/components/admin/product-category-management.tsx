"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductCategory } from "@/types/entities/product-category";
import { CreateCategoryInput, UpdateCategoryInput } from "@/types/forms/product-category-form";
import { ApiSuccess, ApiError } from "@/types/common/api";
import { cn } from "@/lib/utils";
import { ManagementModal } from "@/components/admin/management-modal";
import { ManagementStatusMessage } from "@/components/admin/management-status-message";
import { ManagementEmptyState } from "@/components/admin/management-empty-state";
import { ManagementToolbar } from "@/components/admin/management-toolbar";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";

type CategoryFormState = {
  code: string;
  name: string;
  parentId: string;
};

const initialForm: CategoryFormState = {
  code: "",
  name: "",
  parentId: "",
};

export function ProductCategoryManagement() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [categoryToDeactivate, setCategoryToDeactivate] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  async function loadCategories() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (statusFilter === "active") params.set("isActive", "true");
    if (statusFilter === "inactive") params.set("isActive", "false");

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/admin/product-categories${query}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<ProductCategory[]> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal memuat kategori produk");
      setLoading(false);
      return;
    }

    setCategories((body as ApiSuccess<ProductCategory[]>)?.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setEditingCategoryId(null);
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

  const filteredCategories = useMemo(() => categories, [categories]);

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload: CreateCategoryInput = {
      code: form.code || null,
      name: form.name,
      parent_id: form.parentId || null,
      is_active: true,
    };

    const response = await fetch("/api/admin/product-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<ProductCategory> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menambah kategori");
      return;
    }

    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Kategori produk berhasil ditambahkan.");
    await loadCategories();
  }

  function startEdit(category: ProductCategory) {
    setEditingCategoryId(category.id);
    setForm({
      code: category.code ?? "",
      name: category.name ?? "",
      parentId: category.parent_id ?? "",
    });
    setIsModalOpen(true);
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCategoryId) return;

    setError(null);
    setMessage(null);

    const payload: UpdateCategoryInput = {
      code: form.code || null,
      name: form.name,
      parent_id: form.parentId || null,
    };

    const response = await fetch(`/api/admin/product-categories/${editingCategoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<ProductCategory> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal update kategori");
      return;
    }

    setEditingCategoryId(null);
    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Data kategori berhasil diperbarui.");
    await loadCategories();
  }

  async function deactivateCategory(categoryId: string) {
    setDeactivating(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/product-categories/${categoryId}`, { method: "DELETE" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<null> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menonaktifkan kategori");
      setDeactivating(false);
      setIsConfirmOpen(false);
      return;
    }

    setMessage("Kategori produk berhasil dinonaktifkan.");
    setIsConfirmOpen(false);
    setDeactivating(false);
    await loadCategories();
  }

  return (
    <section className="flex flex-col gap-4">
        <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="space-y-3">
          <ManagementToolbar
            title="Master Kategori Produk"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={loadCategories}
            onRefresh={loadCategories}
            actionLabel="Tambah Kategori"
            onAction={() => {
              setEditingCategoryId(null);
              setForm(initialForm);
              setIsModalOpen(true);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            placeholder="Cari nama / kode kategori"
            filters={
              <select
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm font-medium"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
              </select>
            }
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <ManagementStatusMessage type="loading">Memuat data kategori...</ManagementStatusMessage> : null}
          {error ? <ManagementStatusMessage type="error">{error}</ManagementStatusMessage> : null}
          {message ? <ManagementStatusMessage type="success">{message}</ManagementStatusMessage> : null}

          {!loading && filteredCategories.length === 0 ? (
            <ManagementEmptyState title="Belum ada kategori produk." />
          ) : null}

          {viewMode === 'grid' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCategories.map((category) => (
                  <div key={category.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                              <p className="truncate text-sm font-black text-foreground uppercase tracking-tight">
                                  {category.name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Kode: {category.code || "-"}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                  <span className={cn(
                                      "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                      category.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                                  )}>
                                      {category.is_active ? "Aktif" : "Nonaktif"}
                                  </span>
                                  {category.parent_id && (
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                          Sub dari: {category.parent_id}
                                      </span>
                                  )}
                              </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary" onClick={() => startEdit(category)}>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </Button>
                              <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50 disabled:opacity-30" 
                                  onClick={() => {
                                      setCategoryToDeactivate(category.id);
                                      setIsConfirmOpen(true);
                                  }}
                                  disabled={!category.is_active}
                              >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                              </Button>
                          </div>
                      </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
                {filteredCategories.map((category) => (
                    <div key={category.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary font-black text-primary text-xs uppercase">
                                    {category.name.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{category.name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{category.code || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter",
                                    category.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                                )}>
                                    {category.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase text-primary hover:bg-primary/5" onClick={() => startEdit(category)}>Edit</Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 text-[10px] font-bold uppercase text-red-600 hover:bg-red-50 disabled:opacity-30" 
                                    onClick={() => {
                                        setCategoryToDeactivate(category.id);
                                        setIsConfirmOpen(true);
                                    }} 
                                    disabled={!category.is_active}
                                >
                                    Off
                                </Button>
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
            setEditingCategoryId(null);
            setForm(initialForm);
          }
        }}
      >
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">
                        {editingCategoryId ? "Edit Kategori" : "Tambah Kategori Baru"}
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => {
                            setIsModalOpen(false);
                            setEditingCategoryId(null);
                            setForm(initialForm);
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={editingCategoryId ? submitEdit : createCategory}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nama Kategori</label>
                            <Input
                                className="rounded-xl"
                                placeholder="Contoh: Makanan, Minuman, Elektronik"
                                value={form.name}
                                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kode (Opsional)</label>
                                <Input
                                    className="rounded-xl"
                                    placeholder="Contoh: MKN-01"
                                    value={form.code}
                                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Induk (Opsional)</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
                                    value={form.parentId}
                                    onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value }))}
                                >
                                    <option value="">Pilih Kategori Induk</option>
                                    {categories
                                        .filter(c => c.id !== editingCategoryId && !c.parent_id)
                                        .map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="rounded-xl font-bold uppercase text-xs"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingCategoryId(null);
                                    setForm(initialForm);
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs">
                                {editingCategoryId ? "Simpan Perubahan" : "Simpan Kategori"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
      </ManagementModal>

      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Nonaktifkan Kategori"
        description="Apakah Anda yakin ingin menonaktifkan kategori ini? Produk dalam kategori ini tetap ada namun kategori tidak akan muncul di pilihan saat input produk baru."
        confirmLabel="Nonaktifkan"
        variant="destructive"
        loading={deactivating}
        onConfirm={() => categoryToDeactivate && deactivateCategory(categoryToDeactivate)}
      />
    </section>
  );
}

