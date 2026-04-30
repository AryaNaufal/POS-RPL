import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  hashPassword,
  hashPasswordResetToken,
} from "@/lib/auth/password-reset";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    token?: string;
    password?: string;
    confirmPassword?: string;
  } | null;

  const token = String(body?.token ?? "").trim();
  const password = String(body?.password ?? "");
  const confirmPassword = String(body?.confirmPassword ?? "");

  if (!token) {
    return NextResponse.json({ error: "Token reset password tidak valid." }, { status: 400 });
  }

  if (password.length < 8 || password.length > 72) {
    return NextResponse.json(
      { error: "Password harus 8-72 karakter." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Konfirmasi password tidak sama." }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(token);
  const supabase = createServiceClient();
  const { data: resetToken, error } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle<{ id: string; user_id: string; expires_at: string; used_at: string | null }>();

  if (error || !resetToken) {
    return NextResponse.json({ error: "Token reset password tidak valid." }, { status: 400 });
  }

  if (resetToken.used_at) {
    return NextResponse.json({ error: "Token sudah digunakan." }, { status: 400 });
  }

  if (new Date(resetToken.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "Token sudah kedaluwarsa." }, { status: 400 });
  }

  const passwordHash = hashPassword(password);
  const { error: updateUserError } = await supabase
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("id", resetToken.user_id);

  if (updateUserError) {
    return NextResponse.json({ error: "Gagal memperbarui password." }, { status: 500 });
  }

  const { error: markTokenError } = await supabase
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", resetToken.id);

  if (markTokenError) {
    return NextResponse.json({ error: "Gagal memfinalisasi reset password." }, { status: 500 });
  }

  return NextResponse.json({ message: "Password berhasil diperbarui. Silakan login ulang." });
}
