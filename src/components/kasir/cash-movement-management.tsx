"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CashMovement } from "@/types/entities/cash-movement";
import type { CreateCashMovementInput } from "@/types/forms/cash-movement-form";
import type { CashMovementType } from "@/types/common/enums";
import type { ApiSuccess, ApiError } from "@/types/common/api";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CashMovementManagement({ storeId }: { storeId: string }) {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("0");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<CashMovementType>("in");

  async function loadMovements() {
    setLoading(true);
    try {
      const response = await fetch(`/api/kasir/cash-movements?storeId=${storeId}`);
      const body = (await response.json().catch(() => null)) as ApiSuccess<CashMovement[]> | ApiError | null;
      if (response.ok && body && "data" in body) {
        setMovements(body.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMovements();
  }, [storeId]);

  async function submit() {
    if (!amount || Number(amount) <= 0 || !reason) return;
    try {
      const payload: CreateCashMovementInput = {
        store_id: storeId,
        movement_type: type,
        amount: Number(amount),
        reason,
      };

      const response = await fetch("/api/kasir/cash-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setAmount("0");
        setReason("");
        loadMovements();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Kas Masuk / Keluar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            variant={type === "in" ? "default" : "outline"} 
            className={type === "in" ? "flex-1 bg-emerald-600 hover:bg-emerald-700" : "flex-1"}
            onClick={() => setType("in")}
          >
            Kas Masuk
          </Button>
          <Button 
            variant={type === "out" ? "default" : "outline"} 
            className={type === "out" ? "flex-1 bg-red-600 hover:bg-red-700" : "flex-1"}
            onClick={() => setType("out")}
          >
            Kas Keluar
          </Button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Jumlah
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" />
          </label>
          <label className="block text-xs font-medium text-muted-foreground">
            Alasan
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: Tambah modal / beli ATK" />
          </label>
          <Button className="w-full" onClick={submit}>Simpan Perubahan Kas</Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Histori Kas Hari Ini</p>
          <div className="space-y-2 max-h-40 overflow-auto pr-1">
            {movements.map((m) => (
              <div key={m.id} className="flex justify-between items-start text-xs border-b border-border/40 pb-2">
                <div>
                  <p className="font-semibold text-foreground">{m.reason}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString("id-ID")}</p>
                </div>
                <span className={m.movement_type === "in" ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                  {m.movement_type === "in" ? "+" : "-"}{formatRupiah(m.amount)}
                </span>
              </div>
            ))}
            {movements.length === 0 && <p className="text-xs text-muted-foreground">Belum ada pergerakan kas.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

