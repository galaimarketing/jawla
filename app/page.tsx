import Link from "next/link";
import { ArrowRight, Compass, Globe, Smartphone } from "lucide-react";
import { DemoOne } from "@/components/ui/demo";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-20">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">jawla</h1>
          <div className="flex gap-3">
            <Link href="/auth" className="rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white/10">
              Sign in
            </Link>
            <Link href="/app" className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">MVP for mobile-first virtual tours</p>
            <h2 className="text-4xl font-bold leading-tight md:text-5xl">Create 360 room tours and share instantly.</h2>
            <p className="mt-4 text-slate-300">
              Capture room photos on your phone, generate panoramas, connect hotspots, and publish a shareable tour page optimized for WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app/new" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black">
                Create Tour <ArrowRight size={16} />
              </Link>
              <Link href="/app" className="rounded-full border border-white/20 px-5 py-2.5 text-sm hover:bg-white/10">
                View Dashboard
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><Smartphone className="mb-2" size={16} />Mobile camera upload</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><Compass className="mb-2" size={16} />Hotspot navigation</div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><Globe className="mb-2" size={16} />Public share links</div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-2">
            <DemoOne />
          </div>
        </div>
      </section>
    </main>
  );
}
