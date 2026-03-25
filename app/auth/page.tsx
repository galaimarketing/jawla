"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSendLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Magic link sent. Check your email.");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6">
        <h1 className="text-2xl font-semibold">Sign in to jawla</h1>
        <p className="mt-2 text-sm text-slate-300">Use a passwordless magic link (Supabase OTP).</p>

        <form className="mt-6 space-y-4" onSubmit={handleSendLink}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
          />
          <button
            disabled={loading}
            className="w-full rounded-lg bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
            type="submit"
          >
            {loading ? "Sending..." : "Send magic link"}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}
      </div>
    </main>
  );
}
