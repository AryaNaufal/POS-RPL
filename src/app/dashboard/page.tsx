import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { hasAdminAccess } from "@/lib/auth/admin-access";
import { hasKasirAccess } from "@/lib/auth/kasir-access";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/");
  }

  const [isAdmin, isKasir] = await Promise.all([
    hasAdminAccess(session.userId),
    hasKasirAccess(session.userId),
  ]);

  if (isAdmin) {
    redirect("/dashboard/admin");
  }

  if (isKasir) {
    redirect("/dashboard/kasir");
  }

  redirect("/");
}
