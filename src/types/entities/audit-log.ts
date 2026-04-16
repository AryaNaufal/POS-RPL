export type AuditLog = {
  id: number;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: any | null;
  after_data: any | null;
  created_at: string;
};

export type CreateAuditLogInput = {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
};
