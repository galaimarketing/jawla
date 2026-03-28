import { redirect } from "next/navigation";
import DashboardChrome from "@/components/dashboard-chrome";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Ensure every authenticated user has a profile row.
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    },
    { onConflict: "id" },
  );

  return <DashboardChrome>{children}</DashboardChrome>;
}
