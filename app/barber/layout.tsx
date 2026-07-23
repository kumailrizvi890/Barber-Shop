"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppProvider, useApp } from "@/lib/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import { TabBar } from "@/components/TabBar";

function Shell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useApp();
  const supabase = createClient();
  const router = useRouter();
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "barber")) router.push("/auth");
  }, [loading, profile, router]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("barber_id", profile.id)
      .eq("status", "pending")
      .then(({ count }) => setHasPending(!!count && count > 0));
  }, [profile, supabase]);

  if (loading || !profile || profile.role !== "barber") {
    return (
      <div className="app-shell items-center justify-center">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-14">
        <div className="font-headline text-[17px] tracking-tight">
          FADE <span className="text-gold">KINGS</span>{" "}
          <span className="font-body text-[10px] font-normal text-muted">BARBER</span>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-xs font-bold text-gold"
          style={{ background: "linear-gradient(135deg,#2a2a2a,#151515)" }}
        >
          {profile?.initials}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-5 pb-7 pt-3.5">{children}</div>
      <TabBar role="barber" badge={hasPending} />
    </div>
  );
}

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Shell>{children}</Shell>
    </AppProvider>
  );
}
