import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Tour } from "@/lib/types";

export default async function AppDashboardPage() {
  const supabase = await createClient();

  const { data: tours, error } = await supabase
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className="text-sm text-red-300">Failed to load tours: {error.message}</p>;
  }

  const rows = (tours ?? []) as Tour[];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your tours</h1>
        <Link href="/app/new" className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black">Create new</Link>
      </div>

      <div className="grid gap-3">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 p-6 text-sm text-slate-300">No tours yet.</div>
        ) : (
          rows.map((tour) => (
            <div key={tour.id} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-medium">{tour.title}</h2>
                  <p className="text-xs text-slate-400">/{tour.slug} · {tour.status}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/t/${tour.slug}`} className="rounded-md border border-white/20 px-3 py-1.5 text-sm">View</Link>
                  <Link href={`/app/tours/${tour.id}`} className="rounded-md bg-white px-3 py-1.5 text-sm text-black">Manage</Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
