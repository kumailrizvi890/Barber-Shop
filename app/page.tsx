import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).single();
  if (profile?.role === "owner") redirect("/owner/dashboard");
  if (profile?.role === "barber") redirect(profile.status === "approved" ? "/barber/requests" : "/pending");
  redirect("/customer/home");
}
