"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { newTourCopy } from "@/lib/locale-copy";
import { useLanguage } from "@/contexts/language-context";

export default function NewTourPage() {
  const { locale } = useLanguage();
  const n = newTourCopy(locale);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, language }),
      });

      const data = (await res.json()) as { tourId?: string; message?: string };
      if (!res.ok || !data.tourId) {
        throw new Error(data.message || n.failedCreate);
      }

      router.push(`/app/tours/${data.tourId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : n.unexpected);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[#0b1228]/70 p-6 backdrop-blur-sm"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <h1 className="text-xl font-semibold">{n.title}</h1>
      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm text-slate-300">{n.tourTitle}</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2"
            placeholder={n.tourTitlePlaceholder}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">{n.language}</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2"
          >
            <option value="en">{n.english}</option>
            <option value="ar">{n.arabic}</option>
          </select>
        </div>

        <button disabled={loading} className="w-full rounded-full bg-white py-2 font-medium text-black disabled:opacity-60">
          {loading ? n.creating : n.createTour}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
