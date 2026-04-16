import { UserRoleManagement } from "@/components/admin/user-role-management";

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-white/80 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Admin / User</p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Manajemen User & Role</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Kelola status aktif user dan assignment role per toko.
        </p>
      </header>
      <UserRoleManagement />
    </div>
  );
}

