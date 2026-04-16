"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductUnit } from "@/types/entities/product-unit";
import { CreateUnitInput, UpdateUnitInput } from "@/types/forms/product-unit-form";
import { ApiSuccess, ApiError } from "@/types/common/api";
import { cn } from "@/lib/utils";
import { ManagementModal } from "@/components/admin/management-modal";
import { ManagementStatusMessage } from "@/components/admin/management-status-message";
import { ManagementEmptyState } from "@/components/admin/management-empty-state";
import { ManagementToolbar } from "@/components/admin/management-toolbar";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";

type UnitFormState = {
  name: string;
  symbol: string;
};

const initialForm: UnitFormState = {
  name: "",
  symbol: "",
};

export function ProductUnitManagement() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState<UnitFormState>(initialForm);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadUnits() {
    setLoading(true);
    setError(null);

    const query = keyword.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : "";
    const response = await fetch(`/api/admin/product-units${query}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<ProductUnit[]> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal memuat data satuan");
      setLoading(false);
      return;
    }

    setUnits((body as ApiSuccess<ProductUnit[]>)?.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadUnits();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setEditingUnitId(null);
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

  const filteredUnits = useMemo(() => units, [units]);

  async function createUnit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload: CreateUnitInput = {
      name: form.name,
      symbol: form.symbol,
    };

    const response = await fetch("/api/admin/product-units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<ProductUnit> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menambah satuan");
      return;
    }

    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Satuan produk berhasil ditambahkan.");
    await loadUnits();
  }

  function startEdit(unit: ProductUnit) {
    setEditingUnitId(unit.id);
    setForm({
      name: unit.name ?? "",
      symbol: unit.symbol ?? "",
    });
    setIsModalOpen(true);
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUnitId) return;

    setError(null);
    setMessage(null);

    const payload: UpdateUnitInput = {
      name: form.name,
      symbol: form.symbol,
    };

    const response = await fetch(`/api/admin/product-units/${editingUnitId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<ProductUnit> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal update satuan");
      return;
    }

    setEditingUnitId(null);
    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Data satuan berhasil diperbarui.");
    await loadUnits();
  }

  async function deleteUnit(unitId: string) {
    setDeleting(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/product-units/${unitId}`, { method: "DELETE" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<null> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menghapus satuan");
      setDeleting(false);
      setIsConfirmOpen(false);
      return;
    }

    setMessage("Satuan produk berhasil dihapus.");
    setIsConfirmOpen(false);
    setDeleting(false);
    await loadUnits();
  }

  return (
    <section className="flex flex-col gap-4">
        <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="space-y-3">
          <ManagementToolbar
            title="Master Satuan Produk"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={loadUnits}
            onRefresh={loadUnits}
            actionLabel="Tambah Satuan"
            onAction={() => {
              setEditingUnitId(null);
              setForm(initialForm);
              setIsModalOpen(true);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            placeholder="Cari nama / simbol satuan"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <ManagementStatusMessage type="loading">Memuat data satuan...</ManagementStatusMessage> : null}
          {error ? <ManagementStatusMessage type="error">{error}</ManagementStatusMessage> : null}
          {message ? <ManagementStatusMessage type="success">{message}</ManagementStatusMessage> : null}

          {!loading && filteredUnits.length === 0 ? (
            <ManagementEmptyState title="Belum ada satuan produk." />
          ) : null}

          {viewMode === 'grid' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredUnits.map((unit) => (
                  <div key={unit.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                              <p className="truncate text-sm font-black text-foreground uppercase tracking-tight">
                                  {unit.name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Simbol: {unit.symbol}
                              </p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary" onClick={() => startEdit(unit)}>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </Button>
                              <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50" 
                                  onClick={() => {
                                      setUnitToDelete(unit.id);
                                      setIsConfirmOpen(true);
                                  }}
                              >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </Button>
                          </div>
                      </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
                {filteredUnits.map((unit) => (
                    <div key={unit.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary font-black text-primary text-xs uppercase">
                                    {unit.symbol}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{unit.name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{unit.symbol}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase text-primary hover:bg-primary/5" onClick={() => startEdit(unit)}>Edit</Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 text-[10px] font-bold uppercase text-red-600 hover:bg-red-50" 
                                    onClick={() => {
                                        setUnitToDelete(unit.id);
                                        setIsConfirmOpen(true);
                                    }}
                                >
                                    Hapus
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
            setEditingUnitId(null);
            setForm(initialForm);
          }
        }}
      >
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">
                        {editingUnitId ? "Edit Satuan" : "Tambah Satuan Baru"}
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => {
                            setIsModalOpen(false);
                            setEditingUnitId(null);
                            setForm(initialForm);
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={editingUnitId ? submitEdit : createUnit}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nama Satuan</label>
                            <Input
                                className="rounded-xl"
                                placeholder="Contoh: Kilogram, PCS, Liter"
                                value={form.name}
                                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Simbol / Abstraksi</label>
                            <Input
                                className="rounded-xl"
                                placeholder="Contoh: KG, PCS, L"
                                value={form.symbol}
                                onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value }))}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="rounded-xl font-bold uppercase text-xs"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingUnitId(null);
                                    setForm(initialForm);
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs">
                                {editingUnitId ? "Simpan Perubahan" : "Simpan Satuan"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
      </ManagementModal>

      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Hapus Satuan"
        description="Apakah Anda yakin ingin menghapus satuan produk ini? Satuan yang sudah dihapus tidak dapat dikembalikan."
        confirmLabel="Hapus"
        variant="destructive"
        loading={deleting}
        onConfirm={() => unitToDelete && deleteUnit(unitToDelete)}
      />
    </section>
  );
}

