"use client";

import { tourManageHeader } from "@/lib/locale-copy";
import { useLanguage } from "@/contexts/language-context";

export function TourManageIntro({ title, variant }: { title: string; variant: "empty" | "full" }) {
  const { locale } = useLanguage();
  const h = tourManageHeader(locale);

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {variant === "empty" ? (
        <p className="text-sm text-slate-300">{h.emptyHint}</p>
      ) : (
        <p className="text-sm text-slate-400">{h.subtitle}</p>
      )}
    </div>
  );
}
