"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AuditLog } from "@/types/entities/audit-log";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type AuditLogWithUser = AuditLog & {
  users?: { id: string; name: string; email: string } | null;
};

export function AuditLogManagement() {
  const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      const body = (await response.json().catch(() => null)) as ApiSuccess<AuditLogWithUser[]> | ApiError | null;
      if (response.ok && body && "data" in body) {
        setLogs(body.data || []);
      } else {
        throw new Error((body as ApiError)?.message ?? "Gagal memuat log audit");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Aktivitas Terkini</CardTitle>
        <Button variant="outline" size="sm" onClick={loadLogs}>Refresh</Button>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2">Waktu</th>
              <th className="pb-2">User</th>
              <th className="pb-2">Aksi</th>
              <th className="pb-2">Entitas</th>
              <th className="pb-2">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading && <tr><td colSpan={5} className="py-4 text-center">Memuat...</td></tr>}
            {!loading && logs.map((log) => (
              <tr key={log.id}>
                <td className="py-2 text-[10px]">{new Date(log.created_at).toLocaleString("id-ID")}</td>
                <td className="py-2">
                  <p className="font-semibold">{log.users?.name || "System"}</p>
                  <p className="text-[10px] text-muted-foreground">{log.users?.email}</p>
                </td>
                <td className="py-2"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold uppercase">{log.action}</span></td>
                <td className="py-2 text-xs text-muted-foreground">{log.entity_type}</td>
                <td className="py-2">
                  <pre className="text-[10px] max-w-xs overflow-hidden text-ellipsis bg-secondary/20 p-1 rounded">
                    {JSON.stringify(log.after_data || log.before_data || {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">Belum ada aktivitas tercatat.</td></tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

