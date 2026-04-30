export type User = {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  is_active: boolean;
  approval_status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  approved_by: string | null;
  approval_note: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

