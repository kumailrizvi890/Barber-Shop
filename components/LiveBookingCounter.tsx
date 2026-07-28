"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Subscribes to the public `site_stats` row that a DB trigger keeps in sync
// on every booking insert (see supabase/migrations/002_owner_dashboard.sql).
// Individual bookings are never exposed to anon visitors — this is a single
// public counter row instead, so the landing page can show a live total.
export function useLiveBookingCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase
      .from("site_stats")
      .select("value")
      .eq("key", "total_bookings")
      .single()
      .then(({ data }) => {
        if (active && data) setCount(data.value);
      });

    const channel = supabase
      .channel("site_stats-total_bookings")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "site_stats", filter: "key=eq.total_bookings" },
        (payload) => setCount((payload.new as { value: number }).value)
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}

export function LiveBookingCounter({ label = "Online Bookings" }: { label?: string }) {
  const count = useLiveBookingCount();
  return (
    <div className="rounded-[14px] border border-line/[0.07] bg-card px-2 py-4 text-center">
      <div className="font-headline text-[20px] text-gold">{count === null ? "—" : count.toLocaleString()}</div>
      <div className="mt-1 text-[10px] text-muted">{label}</div>
    </div>
  );
}
