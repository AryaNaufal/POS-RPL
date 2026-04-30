"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type RequestStatus =
  | { type: "success" | "error"; message: string }
  | null;

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<RequestStatus>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (!response.ok) {
        setStatus({
          type: "error",
          message: body?.error ?? "Permintaan reset password gagal diproses.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: body?.message ?? "Jika email terdaftar, tautan reset password sudah dikirim.",
      });
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
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              Masukkan email akun Anda. Jika terdaftar, kami akan kirim tautan reset password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

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

              <Button className="w-full rounded-xl" disabled={loading}>
                {loading ? "Memproses..." : "Kirim Link Reset"}
              </Button>
            </form>

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
