import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AuthPage from "./auth/page";

// The public landing page lives at /auth, but visitors should land on it
// at / with no sign-in step: guests see the hero, services, and crew
// right away instead of being bounced to a login wall. Signed-in visitors
// still go straight to their app. If Supabase cannot be reached at all
// (paused project), the landing page renders with bundled sample data.
export default async function RootPage() {
  let userId: string | null = null;
  let role: string | null = null;
  let status: string | null = null;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();
      role = profile?.role ?? null;
      status = profile?.status ?? null;
    }
  } catch {
    // Supabase unreachable: treat the visitor as a guest below.
    userId = null;
    role = null;
    status = null;
  }

  if (userId) {
    if (role === "owner") redirect("/owner/dashboard");
    if (role === "barber") redirect(status === "approved" ? "/barber/requests" : "/pending");
    redirect("/customer/home");
  }

  return <AuthPage />;
}
