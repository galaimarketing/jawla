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

  // Ensure every authenticated user has a profile row.
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    },
    { onConflict: "id" },
  );

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
    redirect("/");
  }

  return (
    <main className="min-h-screen">
      <header className="fixed left-1/2 top-5 z-30 w-[calc(100%-1.5rem)] max-w-6xl -translate-x-1/2 rounded-full border border-white/15 bg-[#0b1228]/65 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link href="/" className="font-semibold">jawla</Link>
            <Link href="/app" className="rounded-full border border-transparent px-3 py-1.5 text-sm text-slate-300 hover:border-white/20 hover:bg-white/5">Tours</Link>
            <Link href="/app/new" className="rounded-full border border-transparent px-3 py-1.5 text-sm text-slate-300 hover:border-white/20 hover:bg-white/5">New Tour</Link>
          </div>
          <form action={signOut}>
            <button className="rounded-full border border-white/20 px-4 py-1.5 text-sm hover:bg-white/10">Sign out</button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-28">{children}</div>
    </main>
  );
}
