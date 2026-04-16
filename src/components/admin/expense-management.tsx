"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Store } from "@/types/entities/store";
import type { Expense } from "@/types/entities/expense";
import type { CreateExpenseInput } from "@/types/forms/expense-form";
import type { ApiSuccess, ApiError } from "@/types/common/api";
import { cn } from "@/lib/utils";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const CATEGORIES = ["Listrik & Air", "Gaji Karyawan", "Sewa Tempat", "ATK & Kebersihan", "Maintenance", "Lain-lain"];

type ExpenseWithRelations = Expense & {
  stores?: { name: string } | null;
};

export function ExpenseManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [expenses, setExpenses] = useState<ExpenseWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [storeId, setStoreId] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  async function loadOptions() {
    const response = await fetch("/api/admin/purchase-master/options", { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<{ stores: Store[] }> | ApiError | null;
    if (response.ok && body && "data" in body) {
        setStores(body.data.stores || []);
        if (body.data.stores?.length > 0 && !storeId) setStoreId(body.data.stores[0].id);
    }
  }

  async function loadExpenses() {
    setLoading(true);
    const response = await fetch("/api/admin/expenses", { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as ApiSuccess<ExpenseWithRelations[]> | ApiError | null;
    if (response.ok && body && "data" in body) {
        setExpenses(body.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOptions();
    loadExpenses();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        resetForm();
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

  function resetForm() {
    setDescription("");
    setAmount("0");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    if (stores.length > 0) setStoreId(stores[0].id);
    setCategory(CATEGORIES[0]);
  }

  async function submit() {
    if (!storeId || !description || Number(amount) <= 0) return;
    try {
      const payload: CreateExpenseInput = {
        store_id: storeId,
        category,
        description,
        amount: Number(amount),
        expense_date: expenseDate,
      };

      const response = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        resetForm();
        setIsModalOpen(false);
        loadExpenses();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm overflow-hidden">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-xl font-black uppercase tracking-tighter text-primary">Operasional & Biaya Pengeluaran</CardTitle>
            <Button 
                className="h-10 px-4 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs"
                onClick={() => setIsModalOpen(true)}
            >
                Tambah Biaya
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/30 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground border-y border-border/40">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Deskripsi</th>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading && <tr><td colSpan={5} className="py-20 text-center italic text-muted-foreground">Memuat data pengeluaran...</td></tr>}
                {!loading && expenses.length === 0 && <tr><td colSpan={5} className="py-20 text-center italic text-muted-foreground">Belum ada catatan pengeluaran.</td></tr>}
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-muted-foreground">
                        {new Date(e.expense_date).toLocaleDateString("id-ID", { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-tighter border border-blue-100">
                            {e.category}
                        </span>
                    </td>
                    <td className="px-4 py-3 font-bold uppercase tracking-tight">{e.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium uppercase text-[10px] text-muted-foreground">{e.stores?.name}</td>
                    <td className="px-4 py-3 text-right font-black text-red-600">{formatRupiah(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                resetForm();
            }
          }}
        >
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">
                        📝 Catat Biaya Pengeluaran
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => {
                            setIsModalOpen(false);
                            resetForm();
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store / Cabang</label>
                                <select 
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight" 
                                    value={storeId} 
                                    onChange={(e) => setStoreId(e.target.value)}
                                >
                                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kategori Biaya</label>
                                <select 
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium uppercase tracking-tight" 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tanggal Pengeluaran</label>
                            <Input 
                                className="rounded-xl"
                                type="date" 
                                value={expenseDate} 
                                onChange={(e) => setExpenseDate(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deskripsi / Keterangan</label>
                            <Input 
                                className="rounded-xl"
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                placeholder="Contoh: Bayar listrik Januari" 
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Jumlah Biaya (Rp)</label>
                            <Input 
                                className="rounded-xl font-bold"
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                min="1" 
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="rounded-xl font-bold uppercase text-xs"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                            >
                                Batal
                            </Button>
                            <Button 
                                className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs"
                                onClick={submit}
                            >
                                Simpan Biaya
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
