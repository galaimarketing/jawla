"use client";

import Link from "next/link";
import LocaleToggle from "@/components/locale-toggle";
import { nav } from "@/lib/locale-copy";
import { signOutAction } from "@/lib/actions/auth";
import { useLanguage } from "@/contexts/language-context";

export default function DashboardChrome({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const n = nav(locale);

  return (
    <main className="min-h-screen" dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="fixed left-1/2 top-5 z-30 w-[calc(100%-1.5rem)] max-w-6xl -translate-x-1/2 rounded-full border border-white/15 bg-[#0b1228]/65 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link href="/" className="font-semibold">
              {n.brand}
            </Link>
            <Link
              href="/app"
              className="rounded-full border border-transparent px-3 py-1.5 text-sm text-slate-300 hover:border-white/20 hover:bg-white/5"
            >
              {n.tours}
            </Link>
            <Link
              href="/app/new"
              className="rounded-full border border-transparent px-3 py-1.5 text-sm text-slate-300 hover:border-white/20 hover:bg-white/5"
            >
              {n.newTour}
            </Link>
            <LocaleToggle />
          </div>
          <form action={signOutAction}>
            <button type="submit" className="rounded-full border border-white/20 px-4 py-1.5 text-sm hover:bg-white/10">
              {n.signOut}
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-6 pt-28">{children}</div>
    </main>
  );
}
