import { createServiceClient } from "@/lib/supabase/service";
import { CreateAuditLogInput } from "@/types/entities/audit-log";

export async function writeAuditLog(payload: CreateAuditLogInput) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: payload.actorUserId,
    action: payload.action,
    entity_type: payload.entityType,
    entity_id: payload.entityId ?? null,
    before_data: payload.beforeData ?? null,
    after_data: payload.afterData ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function writeAuditLogSafe(payload: CreateAuditLogInput) {
  try {
    await writeAuditLog(payload);
  } catch (error) {
    console.error("Gagal menulis audit log", error);
  }
}


