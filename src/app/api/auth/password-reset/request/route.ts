import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  buildPasswordResetExpiryDate,
  createPasswordResetTokenPair,
  normalizeEmail,
} from "@/lib/auth/password-reset";
import { sendPasswordResetEmail } from "@/lib/email/send-password-reset";

const GENERIC_MESSAGE =
  "Jika email terdaftar, tautan reset password akan dikirim. Silakan cek inbox Anda.";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = normalizeEmail(body?.email ?? "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const supabase = createServiceClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, is_active")
      .eq("email", email)
      .maybeSingle<{ id: string; email: string; is_active: boolean }>();

    if (error || !user || !user.is_active) {
      return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const { token, tokenHash } = createPasswordResetTokenPair();
    const expiresAt = buildPasswordResetExpiryDate();
    const { origin } = new URL(request.url);
    const resetUrl = `${origin}/reset-password/${token}`;

    const { error: cleanupError } = await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("user_id", user.id)
      .is("used_at", null);

    if (cleanupError) {
      console.error("[password-reset][request] cleanup token error:", cleanupError);
    }

    const { error: insertError } = await supabase.from("password_reset_tokens").insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error("[password-reset][request] insert token error:", insertError);
      if (insertError.code === "42P01") {
        return NextResponse.json(
          { error: "Tabel reset password belum tersedia. Jalankan migration terbaru." },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Gagal memproses permintaan reset password." },
        { status: 500 }
      );
    }

    try {
      await sendPasswordResetEmail({
        toEmail: user.email,
        resetUrl,
      });
    } catch (mailError) {
      console.error("[password-reset][request] send email error:", mailError);
      return NextResponse.json(
        { error: "Token reset sudah dibuat, tetapi email gagal dikirim. Periksa konfigurasi SMTP." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (unexpectedError) {
    console.error("[password-reset][request] unexpected error:", unexpectedError);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses reset password." },
      { status: 500 }
    );
  }
}
