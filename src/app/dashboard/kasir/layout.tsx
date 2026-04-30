import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/auth/logout-button";
import { KasirNav } from "@/components/kasir/kasir-nav";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { hasKasirAccess } from "@/lib/auth/kasir-access";

export default async function KasirLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/");
  }

  const allowed = await hasKasirAccess(session.userId);
  if (!allowed) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#f5faf7_0%,#e7f3ee_100%)] px-5 py-6 sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="lg:top-6 lg:h-fit">
          <Card className="rounded-2xl border-white/80 bg-white/92 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-lg">Kasir Menu</CardTitle>
              <p className="text-xs text-muted-foreground">{session.email}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <KasirNav />
              <div className="grid gap-2 pt-2">
                <Button asChild variant="outline">
                  <Link href="/dashboard/kasir">Kembali ke Dashboard Kasir</Link>
                </Button>
                <LogoutButton />
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0 w-full">{children}</section>
      </div>
    </main>
  );
}
