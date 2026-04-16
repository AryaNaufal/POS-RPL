import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { createServiceClient } from "@/lib/supabase/service";
import type { UpdateAppSettingInput } from "@/types/forms/app-setting-form";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("app_settings").select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const settings = (data || []).reduce((acc: Record<string, any>, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});

  return NextResponse.json({ data: settings });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as UpdateAppSettingInput;
  const supabase = createServiceClient();

  for (const [key, value] of Object.entries(body)) {
    await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
  }

  return NextResponse.json({ message: "Pengaturan berhasil disimpan" });
}
