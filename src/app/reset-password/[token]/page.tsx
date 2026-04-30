"use client";

import Link from "next/link";
import { FormEvent, use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type StatusState =
  | { type: "success" | "error"; message: string }
  | null;

export default function ResetPasswordTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = String(resolvedParams.token ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [status, setStatus] = useState<StatusState>(null);

  useEffect(() => {
    async function verifyToken() {
      setChecking(true);
      try {
        const response = await fetch(
          `/api/auth/password-reset/verify?token=${encodeURIComponent(token)}`,
          { cache: "no-store" }
        );
        const body = (await response.json().catch(() => null)) as { valid?: boolean; message?: string } | null;

        if (!response.ok || !body?.valid) {
          setTokenValid(false);
          setStatus({
            type: "error",
            message: body?.message ?? "Token reset password tidak valid.",
          });
          return;
        }

        setTokenValid(true);
        setStatus(null);
      } catch {
        setTokenValid(false);
        setStatus({
          type: "error",
          message: "Gagal memverifikasi token reset password.",
        });
      } finally {
        setChecking(false);
      }
    }

    if (!token) {
      setStatus({
        type: "error",
        message: "Token reset password tidak ditemukan.",
      });
      setTokenValid(false);
      setChecking(false);
      return;
    }

    void verifyToken();
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (password !== confirmPassword) {
      setStatus({
        type: "error",
        message: "Konfirmasi password tidak sama.",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const body = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (!response.ok) {
        setStatus({
          type: "error",
          message: body?.error ?? "Gagal memperbarui password.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: body?.message ?? "Password berhasil diperbarui.",
      });
      setTokenValid(false);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setStatus({
        type: "error",
        message: "Terjadi kesalahan jaringan. Coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7faf8_0%,#edf5f1_100%)] px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-xl">
        <Card className="rounded-3xl border-white/80 bg-white/92 shadow-xl shadow-emerald-950/5 backdrop-blur-sm">
          <CardHeader className="space-y-2 border-b border-border/60 bg-white/75">
            <CardTitle className="text-2xl">Buat Password Baru</CardTitle>
            <CardDescription>
              Masukkan password baru untuk akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {checking ? (
              <p className="text-sm text-muted-foreground">Memverifikasi token reset password...</p>
            ) : null}

            {!checking && tokenValid ? (
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="password">Password Baru</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    minLength={8}
                    maxLength={72}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    minLength={8}
                    maxLength={72}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                <Button className="w-full rounded-xl" disabled={loading}>
                  {loading ? "Memproses..." : "Simpan Password Baru"}
                </Button>
              </form>
            ) : null}

            {status ? (
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-sm leading-6",
                  status.type === "success"
                    ? "border border-primary/20 bg-primary/10 text-foreground"
                    : "border border-red-200 bg-red-50 text-red-700"
                )}
              >
                {status.message}
              </div>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
              Kembali ke{" "}
              <Link href="/" className="font-semibold text-foreground underline underline-offset-4 hover:text-primary">
                halaman login
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
