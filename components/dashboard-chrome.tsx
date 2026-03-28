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
    <main
      className="min-h-screen pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header className="fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-30 w-[calc(100%-1rem)] max-w-6xl -translate-x-1/2 rounded-2xl border border-white/15 bg-[#0b1228]/80 backdrop-blur-md sm:top-5 sm:w-[calc(100%-1.5rem)] sm:rounded-full">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-4 sm:overflow-visible sm:pb-0 [&::-webkit-scrollbar]:hidden">
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
          <form action={signOutAction} className="shrink-0 sm:ms-auto">
            <button
              type="submit"
              className="w-full rounded-full border border-white/20 px-4 py-1.5 text-sm hover:bg-white/10 sm:w-auto"
            >
              {n.signOut}
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-[calc(8.5rem+env(safe-area-inset-top))] sm:pb-6 sm:pt-32">
        {children}
      </div>
    </main>
  );
}
