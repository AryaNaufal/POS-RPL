import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const { userId } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { isActive?: boolean }
    | null;

  if (!userId || typeof body?.isActive !== "boolean") {
    return NextResponse.json(
      { error: "userId dan isActive wajib valid" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data: beforeUser, error: beforeError } = await supabase
    .from("users")
    .select("id, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (beforeError) {
    return NextResponse.json({ error: beforeError.message }, { status: 400 });
  }
  if (!beforeUser) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ is_active: body.isActive })
    .eq("id", userId)
    .select("id, is_active")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "user.status.update",
    entityType: "users",
    entityId: data.id,
    beforeData: beforeUser,
    afterData: data,
  });

  return NextResponse.json({ data });
}
