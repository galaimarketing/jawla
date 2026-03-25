"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewTourPage() {
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
        throw new Error(data.message || "Failed to create tour");
      }

      router.push(`/app/tours/${data.tourId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-lg rounded-xl border border-white/10 bg-slate-900/60 p-6">
      <h1 className="text-xl font-semibold">Create new tour</h1>
      <form className="mt-4 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm text-slate-300">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2"
            placeholder="Sea View Apartment"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-300">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>

        <button disabled={loading} className="w-full rounded-lg bg-white py-2 font-medium text-black disabled:opacity-60">
          {loading ? "Creating..." : "Create tour"}
        </button>
      </form>

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}
