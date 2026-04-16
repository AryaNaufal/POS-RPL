import { createClient } from "@/lib/supabase/route-handler";
import { NextResponse } from "next/server";
import { randomBytes, scryptSync } from "node:crypto";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { name, email, password } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const normalizedName = String(name).trim();
  const normalizedEmail = String(email).trim().toLowerCase();
  const rawPassword = String(password);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  if (normalizedName.length < 2 || normalizedName.length > 80) {
    return NextResponse.json(
      { error: "Nama harus 2-80 karakter" },
      { status: 400 }
    );
  }

  if (!isValidEmail || normalizedEmail.length > 120) {
    return NextResponse.json(
      { error: "Format email tidak valid" },
      { status: 400 }
    );
  }

  if (rawPassword.length < 8 || rawPassword.length > 72) {
    return NextResponse.json(
      { error: "Password harus 8-72 karakter" },
      { status: 400 }
    );
  }

  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(rawPassword, salt, 64).toString("hex");
  const passwordHash = `${salt}:${derivedKey}`;

  const { error } = await supabase.from("users").insert({
    name: normalizedName,
    email: normalizedEmail,
    password_hash: passwordHash,
  });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data: "Registrasi manual berhasil" });
}

