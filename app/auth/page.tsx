"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LocaleToggle from "@/components/locale-toggle";
import { authCopy } from "@/lib/locale-copy";
import { useLanguage } from "@/contexts/language-context";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
  const { locale } = useLanguage();
  const a = authCopy(locale);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      if (data?.url) {
        window.location.assign(data.url);
      } else {
        setMessage(a.googleUrlMissing);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : a.googleFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const result =
        mode === "sign-up"
          ? await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: redirectTo,
                data: {
                  full_name: fullName || null,
                },
              },
            })
          : await supabase.auth.signInWithPassword({
              email,
              password,
            });

      if (result.error) {
        setMessage(result.error.message);
      } else {
        if (mode === "sign-up") {
          if (result.data.session) {
            setMessage(a.accountCreated);
            router.push("/app");
            router.refresh();
          } else {
            setMessage(a.confirmEmailHint);
          }
        } else {
          setMessage(a.signedInRedirect);
          router.push("/app");
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b1228]/70 p-6 shadow-xl backdrop-blur-md">
        <div className="mb-4 flex justify-end">
          <LocaleToggle />
        </div>
        <h1 className="text-2xl font-semibold">{a.title}</h1>
        <p className="mt-2 text-sm text-slate-300">{a.subtitle}</p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-[#020817]/90 px-3 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="text-base font-bold">G</span>}
          {a.google}
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wide text-slate-400">{a.or}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          <button
            type="button"
            onClick={() => setMode("sign-in")}
            className={`rounded-lg px-3 py-2 text-sm ${mode === "sign-in" ? "bg-white text-black" : "text-slate-300"}`}
          >
            {a.signIn}
          </button>
          <button
            type="button"
            onClick={() => setMode("sign-up")}
            className={`rounded-lg px-3 py-2 text-sm ${mode === "sign-up" ? "bg-white text-black" : "text-slate-300"}`}
          >
            {a.signUp}
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleEmailPassword}>
          {mode === "sign-up" ? (
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={a.fullName}
              className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
            />
          ) : null}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={a.emailPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={a.passwordPlaceholder}
            className="w-full rounded-xl border border-white/10 bg-[#020817]/90 px-3 py-2 text-sm"
          />
          <button
            disabled={loading}
            className="w-full rounded-full bg-white px-3 py-2 text-sm font-medium text-black disabled:opacity-60"
            type="submit"
          >
            {loading ? a.wait : mode === "sign-up" ? a.createAccount : a.signInBtn}
          </button>
        </form>

        {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}
      </div>
    </main>
  );
}
