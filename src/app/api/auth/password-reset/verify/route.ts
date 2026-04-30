import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { hashPasswordResetToken } from "@/lib/auth/password-reset";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = String(searchParams.get("token") ?? "").trim();

  if (!token) {
    return NextResponse.json({ valid: false, message: "Token tidak ditemukan." }, { status: 400 });
  }

  const tokenHash = hashPasswordResetToken(token);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle<{ id: string; expires_at: string; used_at: string | null }>();

  if (error || !data) {
    return NextResponse.json({ valid: false, message: "Token tidak valid." }, { status: 400 });
  }

  if (data.used_at) {
    return NextResponse.json({ valid: false, message: "Token sudah digunakan." }, { status: 400 });
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ valid: false, message: "Token sudah kedaluwarsa." }, { status: 400 });
  }

  return NextResponse.json({ valid: true });
}
