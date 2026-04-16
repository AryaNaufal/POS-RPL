"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Customer } from "@/types/entities/customer";
import { CreateCustomerInput, UpdateCustomerInput } from "@/types/forms/customer-form";
import { ApiSuccess, ApiError } from "@/types/common/api";
import { cn } from "@/lib/utils";
import { ManagementModal } from "@/components/admin/management-modal";
import { ManagementStatusMessage } from "@/components/admin/management-status-message";
import { ManagementEmptyState } from "@/components/admin/management-empty-state";
import { ManagementToolbar } from "@/components/admin/management-toolbar";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";

type CustomerFormState = {
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

const initialForm: CustomerFormState = {
  code: "",
  name: "",
  phone: "",
  email: "",
  address: "",
};

export function CustomerManagement() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [form, setForm] = useState<CustomerFormState>(initialForm);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    setError(null);

    const query = keyword.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : "";
    const response = await fetch(`/api/admin/customers${query}`, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Customer[]> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal memuat data customer");
      setLoading(false);
      return;
    }

    setCustomers((body as ApiSuccess<Customer[]>)?.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setEditingCustomerId(null);
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

  const filteredCustomers = useMemo(() => customers, [customers]);

  async function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload: CreateCustomerInput = {
      code: form.code || null,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    };

    const response = await fetch("/api/admin/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Customer> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menambah customer");
      return;
    }

    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Customer berhasil ditambahkan.");
    await loadCustomers();
  }

  function startEdit(customer: Customer) {
    setEditingCustomerId(customer.id);
    setForm({
      code: customer.code ?? "",
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
    });
    setIsModalOpen(true);
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomerId) return;

    setError(null);
    setMessage(null);

    const payload: UpdateCustomerInput = {
      code: form.code || null,
      name: form.name,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
    };

    const response = await fetch(`/api/admin/customers/${editingCustomerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => null)) as ApiSuccess<Customer> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal update customer");
      return;
    }

    setEditingCustomerId(null);
    setForm(initialForm);
    setIsModalOpen(false);
    setMessage("Data customer berhasil diperbarui.");
    await loadCustomers();
  }

  async function deleteCustomer(customerId: string) {
    setDeleting(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/customers/${customerId}`, { method: "DELETE" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<null> | ApiError | null;

    if (!response.ok) {
      setError((body as ApiError)?.message ?? "Gagal menghapus customer");
      setDeleting(false);
      setIsConfirmOpen(false);
      return;
    }

    setMessage("Customer berhasil dihapus.");
    setIsConfirmOpen(false);
    setDeleting(false);
    await loadCustomers();
  }

  return (
    <section className="flex flex-col gap-4">
        <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="space-y-3">
          <ManagementToolbar
            title="Master Database Customer"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={loadCustomers}
            onRefresh={loadCustomers}
            actionLabel="Tambah Customer"
            onAction={() => {
              setEditingCustomerId(null);
              setForm(initialForm);
              setIsModalOpen(true);
            }}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            placeholder="Cari nama / kode / telepon customer..."
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <ManagementStatusMessage type="loading">Memuat data customer...</ManagementStatusMessage> : null}
          {error ? <ManagementStatusMessage type="error">{error}</ManagementStatusMessage> : null}
          {message ? <ManagementStatusMessage type="success">{message}</ManagementStatusMessage> : null}

          {!loading && filteredCustomers.length === 0 ? (
            <ManagementEmptyState title="Belum ada data customer." />
          ) : null}

          {viewMode === 'grid' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                              <p className="truncate text-sm font-black text-foreground uppercase tracking-tight">
                                  {customer.name}
                              </p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  Kode: {customer.code || "-"}
                              </p>
                              <div className="mt-2 space-y-0.5">
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                      {customer.phone || "-"}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                      {customer.email || "-"}
                                  </p>
                                  <p className="truncate text-[10px] text-muted-foreground flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                      {customer.address || "-"}
                                  </p>
                              </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-primary" onClick={() => startEdit(customer)}>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </Button>
                              <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50" 
                                  onClick={() => {
                                      setCustomerToDelete(customer.id);
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
                {filteredCustomers.map((customer) => (
                    <div key={customer.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary font-black text-primary text-xs uppercase">
                                    {customer.name.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{customer.name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{customer.code || "-"} | {customer.phone || "-"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase text-primary hover:bg-primary/5" onClick={() => startEdit(customer)}>Edit</Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 text-[10px] font-bold uppercase text-red-600 hover:bg-red-50" 
                                    onClick={() => {
                                        setCustomerToDelete(customer.id);
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
            setEditingCustomerId(null);
            setForm(initialForm);
          }
        }}
      >
            <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">
                        {editingCustomerId ? "Edit Customer" : "Tambah Customer Baru"}
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => {
                            setIsModalOpen(false);
                            setEditingCustomerId(null);
                            setForm(initialForm);
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={editingCustomerId ? submitEdit : createCustomer}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Informasi Utama</label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                    className="rounded-xl"
                                    placeholder="Nama Lengkap Customer"
                                    value={form.name}
                                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                                    required
                                />
                                <Input
                                    className="rounded-xl"
                                    placeholder="Kode (Opsional)"
                                    value={form.code}
                                    onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kontak & Alamat</label>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Input
                                    className="rounded-xl"
                                    placeholder="No. Telepon / WhatsApp"
                                    value={form.phone}
                                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                                />
                                <Input
                                    className="rounded-xl"
                                    type="email"
                                    placeholder="Alamat Email"
                                    value={form.email}
                                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                                />
                                <div className="sm:col-span-2">
                                    <Input
                                        className="rounded-xl"
                                        placeholder="Alamat Lengkap"
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
                                    setEditingCustomerId(null);
                                    setForm(initialForm);
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs">
                                {editingCustomerId ? "Simpan Perubahan" : "Simpan Customer"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
      </ManagementModal>

      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="Hapus Customer"
        description="Apakah Anda yakin ingin menghapus data customer ini? Data yang sudah dihapus tidak dapat dikembalikan."
        confirmLabel="Hapus"
        variant="destructive"
        loading={deleting}
        onConfirm={() => customerToDelete && deleteCustomer(customerToDelete)}
      />
    </section>
  );
}
