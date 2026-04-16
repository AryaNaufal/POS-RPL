import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireAdminSession } from "@/lib/auth/admin-request";
import { getAccessibleStoreIds, hasStoreAccess } from "@/lib/auth/store-scope";
import { writeAuditLogSafe } from "@/lib/audit/write-audit-log";
import type { User } from "@/types/entities/user";
import type { UserStoreRole } from "@/types/entities/user-store-role";

type ScopedAssignmentRow = Pick<UserStoreRole, "id" | "user_id" | "store_id" | "role_id" | "is_active"> & {
  stores: { id: string; code: string; name: string } | null;
  roles: { id: number; code: string; name: string } | null;
};

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const supabase = createServiceClient();
  const storeIds = await getAccessibleStoreIds(auth.session.userId, ["admin"]);
  if (storeIds.length === 0) {
    return NextResponse.json({
      data: {
        users: [],
        roles: [],
        stores: [],
      },
    });
  }

  const [
    { data: scopedAssignments, error: assignmentError },
    { data: roles, error: rolesError },
    { data: stores, error: storesError },
  ] = await Promise.all([
    supabase
      .from("user_store_roles")
      .select("id, user_id, store_id, role_id, is_active, stores(id, code, name), roles(id, code, name)")
      .in("store_id", storeIds),
    supabase.from("roles").select("id, code, name").in("code", ["admin", "kasir"]).order("id", { ascending: true }),
    supabase
      .from("stores")
      .select("id, code, name")
      .eq("is_active", true)
      .in("id", storeIds)
      .order("name", { ascending: true }),
  ]);

  if (assignmentError || rolesError || storesError) {
    return NextResponse.json(
      { error: assignmentError?.message ?? rolesError?.message ?? storesError?.message ?? "Gagal memuat data" },
      { status: 400 }
    );
  }

  const typedAssignments = (scopedAssignments ?? []) as ScopedAssignmentRow[];
  const userIds = [...new Set(typedAssignments.map((row) => row.user_id).filter(Boolean))];

  let users: User[] = [];
  if (userIds.length > 0) {
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, is_active, created_at, updated_at, last_login_at")
      .in("id", userIds)
      .order("created_at", { ascending: false });

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 400 });
    }

    users = (usersData ?? []) as User[];
  }

  const assignmentByUserId = new Map<string, UserStoreRole[]>();
  for (const assignment of typedAssignments) {
    const userId = String(assignment.user_id ?? "");
    if (!userId) continue;
    const list = assignmentByUserId.get(userId) ?? [];
    list.push(assignment as UserStoreRole);
    assignmentByUserId.set(userId, list);
  }

  const scopedUsers = users.map((user) => ({
    ...user,
    user_store_roles: assignmentByUserId.get(user.id) ?? [],
  }));

  return NextResponse.json({
    data: {
      users: scopedUsers,
      roles: roles ?? [],
      stores: stores ?? [],
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    return auth.response;
  }

  const body = (await request.json().catch(() => null)) as
    | { userId?: string; storeId?: string; roleId?: number }
    | null;

  if (!body?.userId || !body?.storeId || !body?.roleId) {
    return NextResponse.json(
      { error: "userId, storeId, dan roleId wajib diisi" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const canAccessStore = await hasStoreAccess(auth.session.userId, body.storeId, ["admin"]);
  if (!canAccessStore) {
    return NextResponse.json({ error: "Anda tidak punya akses ke store ini." }, { status: 403 });
  }

  const { data: selectedRole, error: roleError } = await supabase
    .from("roles")
    .select("id, code")
    .eq("id", body.roleId)
    .in("code", ["admin", "kasir"])
    .maybeSingle();

  if (roleError || !selectedRole) {
    return NextResponse.json({ error: "Role yang dipilih tidak valid untuk scope sistem ini." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_store_roles")
    .upsert(
      {
        user_id: body.userId,
        store_id: body.storeId,
        role_id: selectedRole.id,
        is_active: true,
      },
      { onConflict: "user_id,store_id,role_id" }
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  await writeAuditLogSafe({
    actorUserId: auth.session.userId,
    action: "user_store_role.assign",
    entityType: "user_store_roles",
    entityId: data.id,
    afterData: {
      userId: body.userId,
      storeId: body.storeId,
      roleId: body.roleId,
      isActive: true,
    },
  });

  return NextResponse.json({ data });
}

