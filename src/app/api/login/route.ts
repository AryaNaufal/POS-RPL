import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { scryptSync, timingSafeEqual } from "node:crypto";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session";
import { User } from "@/types/entities/user";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password || String(password).length > 128) {
    return NextResponse.json(
      { error: "Email atau Password salah" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const sessionSecret = process.env.AUTH_SESSION_SECRET;

  if (!supabaseUrl || !serviceRoleKey || !sessionSecret || sessionSecret.length < 32) {
    return NextResponse.json(
      { error: "Konfigurasi server belum lengkap (SUPABASE_SERVICE_ROLE_KEY/AUTH_SESSION_SECRET)." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, password_hash")
    .eq("email", normalizedEmail)
    .maybeSingle<User>();

  if (error || !data || !data.password_hash) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return NextResponse.json(
      { error: "Email atau Password salah" },
      { status: 401 }
    );
  }

  const [salt, storedHashHex] = data.password_hash.split(":");
  if (!salt || !storedHashHex) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return NextResponse.json(
      { error: "Email atau Password salah" },
      { status: 401 }
    );
  }

  const derivedHash = scryptSync(String(password), salt, 64);
  const storedHash = Buffer.from(storedHashHex, "hex");

  if (storedHash.length !== derivedHash.length || !timingSafeEqual(storedHash, derivedHash)) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return NextResponse.json(
      { error: "Email atau Password salah" },
      { status: 401 }
    );
  }

  const sessionToken = createSessionToken({
    userId: data.id,
    name: data.name,
    email: data.email,
  });

  const response = NextResponse.json({
    data: "OK",
    user: { id: data.id, name: data.name, email: data.email },
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");

  return response;
}

