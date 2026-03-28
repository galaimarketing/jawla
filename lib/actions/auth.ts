"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const s = await createClient();
  await s.auth.signOut();
  redirect("/");
}
