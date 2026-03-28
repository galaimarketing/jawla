"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export default function LocaleToggle({ className = "" }: { className?: string }) {
  const { locale, setLocale, isArabic } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLocale(isArabic ? "en" : "ar")}
      className={`font-space inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-white/10 ${className}`}
      aria-label={isArabic ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe size={14} />
      {isArabic ? "en" : "ar"}
    </button>
  );
}
