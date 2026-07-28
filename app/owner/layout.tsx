"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppProvider, useApp } from "@/lib/context/AppContext";
import { createClient } from "@/lib/supabase/client";
import { TabBar } from "@/components/TabBar";
import { Wordmark } from "@/components/Logo";

function Shell({ children }: { children: React.ReactNode }) {
  const { profile, loading, logout } = useApp();
  const supabase = createClient();
  const router = useRouter();
  const [hasPending, setHasPending] = useState(false);

  useEffect(() => {
    if (!loading && (!profile || profile.role !== "owner")) router.push("/auth");
  }, [loading, profile, router]);

  useEffect(() => {
    if (!profile || profile.role !== "owner") return;
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "barber")
      .eq("status", "pending")
      .then(({ count }) => setHasPending(!!count && count > 0));
  }, [profile, supabase]);

  if (loading || !profile || profile.role !== "owner") {
    return (
      <div className="app-shell items-center justify-center">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="flex shrink-0 items-center justify-between px-5 pb-1 pt-14">
        <Wordmark size={17} sub="OWNER" />
        <button onClick={logout} className="text-[11.5px] font-bold text-muted hover:text-secondary">
          Log Out
        </button>
      </div>
      <div className="flex-1 overflow-auto px-5 pb-7 pt-3.5">{children}</div>
      <TabBar role="owner" badge={hasPending} />
    </div>
  );
}

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Shell>{children}</Shell>
    </AppProvider>
  );
}
