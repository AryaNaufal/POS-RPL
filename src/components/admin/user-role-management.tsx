"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { User } from "@/types/entities/user";
import type { Role } from "@/types/entities/role";
import type { Store } from "@/types/entities/store";
import type { UserStoreRole } from "@/types/entities/user-store-role";
import type { ApiSuccess, ApiError } from "@/types/common/api";
import { cn } from "@/lib/utils";
import { ManagementModal } from "@/components/admin/management-modal";
import { ManagementStatusMessage } from "@/components/admin/management-status-message";
import { ManagementEmptyState } from "@/components/admin/management-empty-state";
import { ManagementToolbar } from "@/components/admin/management-toolbar";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";

type UserRoleWithRelations = UserStoreRole & {
  stores?: Store | null;
  roles?: Role | null;
};

type UserWithRoles = User & {
  user_store_roles?: UserRoleWithRelations[];
};

type ManagementData = {
  users: UserWithRoles[];
  roles: Role[];
  stores: Store[];
};

const initialAssignForm = {
  userId: "",
  storeId: "",
  roleId: "",
};

export function UserRoleManagement() {
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState(initialAssignForm);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<{id: string, current: boolean} | null>(null);
  const [toggling, setToggling] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/user-management", {
      cache: "no-store",
    });
    const body = (await response.json().catch(() => null)) as
      | ApiSuccess<ManagementData>
      | ApiError
      | null;

    if (!response.ok || !body || !("data" in body)) {
      setError((body as ApiError | null)?.message ?? (body as ApiError | null)?.error ?? "Gagal memuat data user");
      setLoading(false);
      return;
    }

    setUsers(body.data.users ?? []);
    setRoles(body.data.roles ?? []);
    setStores(body.data.stores ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
        setAssignForm(initialAssignForm);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isModalOpen]);

  const filteredUsers = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    if (!key) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(key) || user.email.toLowerCase().includes(key)
    );
  }, [users, keyword]);

  async function toggleUserStatus(userId: string, current: boolean) {
    setToggling(true);
    setError(null);
    setMessage(null);

    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !current }),
    });
    const body = (await response.json().catch(() => null)) as
      | ApiError
      | null;

    if (!response.ok) {
      setError(body?.message ?? body?.error ?? "Gagal mengubah status user");
      setToggling(false);
      setIsConfirmOpen(false);
      return;
    }

    setMessage("Status user berhasil diperbarui.");
    setIsConfirmOpen(false);
    setToggling(false);
    await loadData();
  }

  async function submitAssignRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!assignForm.userId || !assignForm.storeId || !assignForm.roleId) {
      setError("Pilih user, toko, dan role terlebih dahulu.");
      return;
    }

    const response = await fetch("/api/admin/user-management", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: assignForm.userId,
        storeId: assignForm.storeId,
        roleId: Number(assignForm.roleId),
      }),
    });
    const body = (await response.json().catch(() => null)) as
      | ApiError
      | null;

    if (!response.ok) {
      setError(body?.message ?? body?.error ?? "Gagal assign role");
      return;
    }

    setMessage("Role berhasil di-assign.");
    setAssignForm(initialAssignForm);
    setIsModalOpen(false);
    await loadData();
  }

  function openAssignModal(userId?: string) {
    setAssignForm({
      ...initialAssignForm,
      userId: userId ?? "",
    });
    setIsModalOpen(true);
  }

  return (
    <section className="flex flex-col gap-4">
        <Card className="rounded-2xl border-white/80 bg-white/90 shadow-sm">
        <CardHeader className="space-y-3">
          <ManagementToolbar
            title="Hak Akses & Role User"
            keyword={keyword}
            onKeywordChange={setKeyword}
            onSearch={loadData}
            onRefresh={loadData}
            actionLabel="Assign Role"
            onAction={() => openAssignModal()}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            placeholder="Cari user berdasarkan nama atau email..."
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <ManagementStatusMessage type="loading">Memuat data user...</ManagementStatusMessage> : null}
          {error ? <ManagementStatusMessage type="error">{error}</ManagementStatusMessage> : null}
          {message ? <ManagementStatusMessage type="success">{message}</ManagementStatusMessage> : null}

          {!loading && filteredUsers.length === 0 ? (
            <ManagementEmptyState title="Belum ada user yang cocok." />
          ) : null}

          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredUsers.map((user) => (
                  <div key={user.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-4 transition-all hover:border-primary/30 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                              <p className="truncate text-sm font-black text-foreground uppercase tracking-tight">{user.name}</p>
                              <p className="truncate text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{user.email}</p>
                              <div className="mt-2">
                                  <span className={cn(
                                      "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                      user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                                  )}>
                                      {user.is_active ? "Akun Aktif" : "Akun Nonaktif"}
                                  </span>
                                  <span className={cn(
                                      "ml-1 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                                      user.approval_status === "approved"
                                        ? "bg-blue-100 text-blue-700"
                                        : user.approval_status === "rejected"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-amber-100 text-amber-700"
                                  )}>
                                      {user.approval_status}
                                  </span>
                              </div>
                          </div>
                          <div className="flex flex-col gap-1">
                              <Button
                                  size="sm"
                                  variant="ghost"
                                  className={cn(
                                      "h-7 text-[9px] font-black uppercase px-2",
                                      user.is_active ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                                  )}
                                  onClick={() => {
                                      setUserToToggle({ id: user.id, current: user.is_active });
                                      setIsConfirmOpen(true);
                                  }}
                              >
                                  {user.is_active ? "Off" : "On"}
                              </Button>
                              <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-[9px] font-black uppercase px-2 text-primary hover:bg-primary/5"
                                  onClick={() => openAssignModal(user.id)}
                              >
                                  Assign
                              </Button>
                          </div>
                      </div>

                      <div className="mt-4 space-y-1.5 border-t pt-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Akses Toko & Role</p>
                          {(user.user_store_roles ?? []).length === 0 ? (
                              <p className="text-[10px] italic text-muted-foreground">Belum memiliki akses toko.</p>
                          ) : (
                              (user.user_store_roles ?? []).map((assignment) => (
                                  <div
                                      key={assignment.id}
                                      className="flex items-center justify-between rounded-lg bg-secondary/30 px-2 py-1.5 text-[10px]"
                                  >
                                      <span className="font-bold text-foreground uppercase tracking-tight">
                                          {assignment.stores?.name ?? "Cabang"}
                                      </span>
                                      <span className="bg-white/50 px-1.5 py-0.5 rounded font-black text-primary uppercase tracking-tighter">
                                          {assignment.roles?.name ?? "Role"}
                                      </span>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="group relative overflow-hidden rounded-2xl border border-border/50 bg-white p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary font-black text-primary text-xs uppercase">
                                    {user.name.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{user.name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex gap-1">
                                    {(user.user_store_roles ?? []).slice(0, 2).map((assignment) => (
                                        <span key={assignment.id} className="px-2 py-1 bg-secondary rounded text-[9px] font-black uppercase">
                                            {assignment.stores?.name} ({assignment.roles?.name})
                                        </span>
                                    ))}
                                    {(user.user_store_roles ?? []).length > 2 && (
                                        <span className="px-2 py-1 bg-secondary rounded text-[9px] font-black uppercase">
                                            +{(user.user_store_roles ?? []).length - 2}
                                        </span>
                                    )}
                                </div>
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter",
                                    user.is_active ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                                )}>
                                    {user.is_active ? "Aktif" : "Nonaktif"}
                                </span>
                                <span className={cn(
                                    "text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter",
                                    user.approval_status === "approved"
                                      ? "bg-blue-100 text-blue-700"
                                      : user.approval_status === "rejected"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-amber-100 text-amber-700"
                                )}>
                                    {user.approval_status}
                                </span>
                                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-bold uppercase text-primary hover:bg-primary/5" onClick={() => openAssignModal(user.id)}>Assign</Button>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className={cn("h-8 text-[10px] font-bold uppercase", user.is_active ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50")} 
                                    onClick={() => {
                                        setUserToToggle({ id: user.id, current: user.is_active });
                                        setIsConfirmOpen(true);
                                    }}
                                >
                                    {user.is_active ? "Off" : "On"}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ManagementModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setAssignForm(initialAssignForm);
          }
        }}
      >
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-lg font-black uppercase tracking-tight">
                        Assign Role & Toko
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full"
                        onClick={() => {
                            setIsModalOpen(false);
                            setAssignForm(initialAssignForm);
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </Button>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4" onSubmit={submitAssignRole}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pilih User</label>
                            <select
                                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
                                value={assignForm.userId}
                                onChange={(event) =>
                                    setAssignForm((current) => ({ ...current, userId: event.target.value }))
                                }
                                required
                            >
                                <option value="">-- Pilih User --</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Toko / Cabang</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
                                    value={assignForm.storeId}
                                    onChange={(event) =>
                                        setAssignForm((current) => ({ ...current, storeId: event.target.value }))
                                    }
                                    required
                                >
                                    <option value="">-- Pilih Toko --</option>
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role Akses</label>
                                <select
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm font-medium"
                                    value={assignForm.roleId}
                                    onChange={(event) =>
                                        setAssignForm((current) => ({ ...current, roleId: event.target.value }))
                                    }
                                    required
                                >
                                    <option value="">-- Pilih Role --</option>
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                className="rounded-xl font-bold uppercase text-xs"
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setAssignForm(initialAssignForm);
                                }}
                            >
                                Batal
                            </Button>
                            <Button type="submit" className="rounded-xl bg-primary font-bold shadow-lg shadow-primary/20 uppercase text-xs">
                                Simpan Hak Akses
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
      </ManagementModal>

      <ConfirmActionDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title={userToToggle?.current ? "Nonaktifkan User" : "Aktifkan User"}
        description={userToToggle?.current 
            ? "Apakah Anda yakin ingin menonaktifkan user ini? User tidak akan bisa login ke sistem." 
            : "Apakah Anda yakin ingin mengaktifkan kembali user ini?"}
        confirmLabel={userToToggle?.current ? "Nonaktifkan" : "Aktifkan"}
        variant={userToToggle?.current ? "destructive" : "default"}
        loading={toggling}
        onConfirm={() => userToToggle && toggleUserStatus(userToToggle.id, userToToggle.current)}
      />
    </section>
  );
}

