import DashboardHomeClient from "@/components/dashboard-home-client";
import { createClient } from "@/lib/supabase/server";
import type { Tour } from "@/lib/types";

export default async function AppDashboardPage() {
  const supabase = await createClient();

  const { data: tours, error } = await supabase
    .from("tours")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (tours ?? []) as Tour[];

  return <DashboardHomeClient tours={rows} errorMessage={error ? error.message : null} />;
}
