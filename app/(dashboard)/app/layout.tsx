import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-semibold">jawla</Link>
            <Link href="/app" className="text-sm text-slate-300">Tours</Link>
            <Link href="/app/new" className="text-sm text-slate-300">New Tour</Link>
          </div>
          <form action={signOut}>
            <button className="rounded-md border border-white/20 px-3 py-1.5 text-sm">Sign out</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
    </main>
  );
}
