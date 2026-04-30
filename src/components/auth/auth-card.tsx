"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ApiSuccess, ApiError } from "@/types/common/api";

type AuthMode = "login" | "register";

type LoginFormState = {
  email: string;
  password: string;
};

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
};

type AuthStatus =
  | {
      type: "success" | "error";
      message: string;
    }
  | null;

const initialLoginForm: LoginFormState = {
  email: "",
  password: "",
};

const initialRegisterForm: RegisterFormState = {
  name: "",
  email: "",
  password: "",
};

export function AuthCard({ userEmail }: { userEmail?: string | null }) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [status, setStatus] = useState<AuthStatus>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const endpoint = mode === "login" ? "/api/login" : "/api/users";
    const payload = mode === "login" ? loginForm : registerForm;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json().catch(() => null)) as ApiSuccess<any> | ApiError | null;

      if (!response.ok) {
        const errorMessage =
          body && "message" in body
            ? String(body.message ?? "")
            : body && "error" in body
              ? String(body.error ?? "")
              : "Terjadi kesalahan. Coba lagi.";
        setStatus({
          type: "error",
          message: errorMessage,
        });
        return;
      }

      if (mode === "register") {
        setLoginForm((current) => ({
          ...current,
          email: registerForm.email,
        }));
        setRegisterForm(initialRegisterForm);
        setMode("login");
        setStatus({
          type: "success",
          message: "Registrasi berhasil. Lanjutkan login dengan akun baru Anda.",
        });
        return;
      }

      setLoginForm(initialLoginForm);
      setStatus({
        type: "success",
        message: "Login berhasil. Mengarahkan ke dashboard...",
      });
      startTransition(() => {
        router.push("/dashboard");
        router.refresh();
      });
    } catch {
      setStatus({
        type: "error",
        message: "Request gagal diproses. Periksa koneksi dan coba lagi.",
      });
    }
  }

  return (
    <Card className="overflow-hidden rounded-3xl border-white/80 bg-white/92 shadow-xl shadow-emerald-950/5 backdrop-blur-sm">
      <CardHeader className="space-y-4 border-b border-border/60 bg-white/75 pb-5">
        <div className="space-y-2">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Portal Kasir
          </div>
          <CardTitle className="text-2xl leading-tight sm:text-[1.65rem]">
            {mode === "login" ? "Masuk ke sistem POS" : "Buat akun pengguna baru"}
          </CardTitle>
          <CardDescription className="leading-6">
            {mode === "login"
              ? "Gunakan email terdaftar untuk mengakses dashboard kasir dan admin."
              : "Daftarkan akun pertama tim Anda agar sistem POS bisa langsung digunakan."}
          </CardDescription>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1.5">
          <Button
            variant={mode === "login" ? "default" : "ghost"}
            className="h-10 w-full rounded-lg"
            type="button"
            onClick={() => {
              setMode("login");
              setStatus(null);
            }}
          >
            Login
          </Button>
          <Button
            variant={mode === "register" ? "default" : "ghost"}
            className="h-10 w-full rounded-lg"
            type="button"
            onClick={() => {
              setMode("register");
              setStatus(null);
            }}
          >
            Register
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6 bg-white">
        {userEmail ? (
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
            Session aktif terdeteksi untuk <span className="font-semibold">{userEmail}</span>.
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          {mode === "register" ? (
            <div className="space-y-2">
              <Label htmlFor="name">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Arya Pratama"
                value={registerForm.name}
                onChange={(event) =>
                  setRegisterForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                disabled={isPending}
                autoComplete="name"
                required
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={`${mode}-email`}>
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${mode}-email`}
              name="email"
              type="email"
              placeholder="arya@example.com"
              value={mode === "login" ? loginForm.email : registerForm.email}
              onChange={(event) => {
                const value = event.target.value;

                if (mode === "login") {
                  setLoginForm((current) => ({
                    ...current,
                    email: value,
                  }));
                  return;
                }

                setRegisterForm((current) => ({
                  ...current,
                  email: value,
                }));
              }}
              disabled={isPending}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${mode}-password`}>
              Password <span className="text-destructive">*</span>
            </Label>
            <Input
              id={`${mode}-password`}
              name="password"
              type="password"
              placeholder="Masukkan password"
              value={mode === "login" ? loginForm.password : registerForm.password}
              onChange={(event) => {
                const value = event.target.value;

                if (mode === "login") {
                  setLoginForm((current) => ({
                    ...current,
                    password: value,
                  }));
                  return;
                }

                setRegisterForm((current) => ({
                  ...current,
                  password: value,
                }));
              }}
              disabled={isPending}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              {mode === "login"
                ? "Gunakan password akun yang sudah terdaftar."
                : "Minimal 6 karakter untuk keamanan akun."}
            </p>
            {mode === "login" ? (
              <p className="text-right text-xs">
                <Link
                  href="/reset-password"
                  className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Lupa Password?
                </Link>
              </p>
            ) : null}
          </div>

          {status ? (
            <div
              role="status"
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

          <Button type="submit" size="lg" className="mt-1 w-full rounded-xl" disabled={isPending}>
            {isPending
              ? "Memproses..."
              : mode === "login"
                ? "Masuk ke Dashboard"
                : "Buat Akun Baru"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setStatus(null);
              }}
              className="font-semibold text-foreground underline underline-offset-4 hover:text-primary"
            >
              {mode === "login" ? "Daftar sekarang" : "Login sekarang"}
            </button>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

