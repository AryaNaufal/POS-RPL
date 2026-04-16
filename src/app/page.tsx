import { AuthCard } from "@/components/auth/auth-card";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

export default async function Home() {
  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(SESSION_COOKIE_NAME)?.value
  );

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(31,111,97,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(227,187,128,0.28),_transparent_32%),linear-gradient(135deg,_#f8f5ef_0%,_#eef3ef_52%,_#fdf9f2_100%)]" />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-8 lg:px-10 lg:py-12">
        <section className="w-full max-w-lg">
          <AuthCard />
        </section>
      </div>
    </main>
  );
}

