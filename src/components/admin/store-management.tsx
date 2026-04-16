"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Store } from "@/types/entities/store";
import { CreateStoreInput, UpdateStoreInput } from "@/types/forms/store-form";
import { ApiSuccess, ApiError } from "@/types/common/api";
import { cn } from "@/lib/utils";
import { ManagementModal } from "@/components/admin/management-modal";
import { ManagementStatusMessage } from "@/components/admin/management-status-message";
import { ManagementEmptyState } from "@/components/admin/management-empty-state";
import { ManagementToolbar } from "@/components/admin/management-toolbar";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";

type StoreFormState = {
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

const initialForm: StoreFormState = {
  code: "",
  name: "",
  phone: "",
  email: "",
  address: "",
};

export function StoreManagement() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [form, setForm] = useState<StoreFormState>(initialForm);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [storeToDeactivate, setStoreToDeactivate] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  async function loadStores() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (statusFilter === "active") params.set("isActive", "true");
    if (statusFilter === "inactive") params.set("isActive", "false");

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await fetch(`/api/admin/stores${query}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Store[]> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal memuat data toko");
      setLoading(false);
      return;
    }

    setStores((body as ApiSuccess<Store[]>)?.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setEditingStoreId(null);
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

  const filteredStores = useMemo(() => stores, [stores]);

  async function createStore(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload: CreateStoreInput = {
      code: form.code,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      is_active: true,
    };

    const response = await fetch("/api/admin/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => null)) as ApiSuccess<Store> | ApiError | null;
    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menambah toko");
      return;
    }

    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Toko berhasil ditambahkan.");
    await loadStores();
  }

  function startEdit(store: Store) {
    setEditingStoreId(store.id);
    setForm({
      code: store.code ?? "",
      name: store.name ?? "",
      phone: store.phone ?? "",
      email: store.email ?? "",
      address: store.address ?? "",
    });
    setIsModalOpen(true);
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingStoreId) return;

    setError(null);
    setMessage(null);

    const payload: UpdateStoreInput = {
      code: form.code,
      name: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address,
    };

    const response = await fetch(`/api/admin/stores/${editingStoreId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Store> | ApiError | null;
    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal update toko");
      return;
    }

    setEditingStoreId(null);
    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Data toko berhasil diperbarui.");
    await loadStores();
  }

  async function deactivateStore(storeId: string) {
    setDeactivating(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/stores/${storeId}`, { method: "DELETE" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<null> | ApiError | null;
    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menonaktifkan toko");
      setDeactivating(false);
      setIsConfirmOpen(false);
      return;
    }

    setMessage("Toko berhasil dinonaktifkan.");
    setIsConfirmOpen(false);
    setDeactivating(false);
    await loadStores();
  }

  return (
    <section className="flex flex-col gap-4">
        <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="space-y-3">
          <ManagementToolbar
            title="Manajemen Cabang / Toko"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={loadStores}
            onRefresh={loadStores}
            actionLabel="Tambah Toko"
            onAction={() => {
              setEditingStoreId(null);
              setForm(initialForm);
              setIsModalOpen(true);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            placeholder="Cari nama / kode toko..."
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
          {loading ? <ManagementStatusMessage type="loading">Memuat data toko...</ManagementStatusMessage> : null}
          {error ? <ManagementStatusMessage type="error">{error}</ManagementStatusMessage> : null}
          {message ? <ManagementStatusMessage type="success">{message}</ManagementStatusMessage> : null}

          {!loading && filteredStores.length === 0 ? (
            <ManagementEmptyState title="Belum ada data toko." />
          ) : null}

          {viewMode === "grid" ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStores.map((store) => (
                  <div key={store.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                              <p className="truncate text-sm font-black text-foreground uppercase tracking-tight">
                                  {store.name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Kode: {store.code}
                              </p>
                              <div className="mt-2 space-y-0.5">
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                      {store.phone || "-"}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                      {store.email || "-"}
                                  </p>
                                  <p className="truncate text-[10px] text-muted-foreground flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                      {store.address || "-"}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                      <span className={cn(
                                          "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                          store.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                                      )}>
                                          {store.is_active ? "Aktif" : "Nonaktif"}
                                      </span>
                                  </div>
                              </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary" onClick={() => startEdit(store)}>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </Button>
                              <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50 disabled:opacity-30" 
                                  onClick={() => {
                                      setStoreToDeactivate(store.id);
                                      setIsConfirmOpen(true);
                                  }}
                                  disabled={!store.is_active}
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
                {filteredStores.map((store) => (
                    <div key={store.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary font-black text-primary text-xs uppercase">
                                    {store.name.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{store.name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{store.code} | {store.phone || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter",
                                    store.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                                )}>
                                    {store.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase text-primary hover:bg-primary/5" onClick={() => startEdit(store)}>Edit</Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 text-[10px] font-bold uppercase text-red-600 hover:bg-red-50 disabled:opacity-30" 
                                    onClick={() => {
                                        setStoreToDeactivate(store.id);
                                        setIsConfirmOpen(true);
                                    }} 
                                    disabled={!store.is_active}
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
            setEditingStoreId(null);
            setForm(initialForm);
          }
        }}
      >
          <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg font-black uppercase tracking-tight">
                {editingStoreId ? "Edit Toko" : "Tambah Toko Baru"}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingStoreId(null);
                  setForm(initialForm);
                }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={editingStoreId ? submitEdit : createStore}>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Informasi Utama
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      className="rounded-xl"
                      placeholder="Nama Toko"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                    <Input
                      className="rounded-xl"
                      placeholder="Kode Toko"
                      value={form.code}
                      onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Kontak & Alamat
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      className="rounded-xl"
                      placeholder="No. Telepon"
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    />
                    <Input
                      className="rounded-xl"
                      type="email"
                      placeholder="Email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />
                    <div className="sm:col-span-2">
                      <Input
                        className="rounded-xl"
                        placeholder="Alamat"
                        value={form.address}
                        onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl font-bold uppercase text-xs"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingStoreId(null);
                      setForm(initialForm);
                    }}
                  >
                    Batal
                  </Button>
                  <Button type="submit" className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs">
                    {editingStoreId ? "Simpan Perubahan" : "Simpan Toko"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
      </ManagementModal>

      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Nonaktifkan Toko"
        description="Apakah Anda yakin ingin menonaktifkan toko ini? Toko yang nonaktif tidak dapat digunakan untuk transaksi baru."
        confirmLabel="Nonaktifkan"
        variant="destructive"
        loading={deactivating}
        onConfirm={() => storeToDeactivate && deactivateStore(storeToDeactivate)}
      />
    </section>
  );
}
