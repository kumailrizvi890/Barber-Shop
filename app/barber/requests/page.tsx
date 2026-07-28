"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { approveBooking, declineBooking } from "@/lib/api";
import type { Booking } from "@/lib/types";

export default function RequestsPage() {
  const supabase = createClient();
  const { profile, refreshNotifications } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("bookings")
      .select("*, customer:customer_id(name)")
      .eq("barber_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setBookings((data as any) ?? []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(b: Booking) {
    await approveBooking(supabase, b);
    await refreshNotifications();
    load();
  }
  async function decline(b: Booking) {
    await declineBooking(supabase, b);
    await refreshNotifications();
    load();
  }

  return (
    <div>
      <div className="mb-1 font-headline text-[19px]">REQUESTS</div>
      <div className="mb-[18px] text-xs text-muted">Approve or decline incoming bookings</div>

      {loading ? (
        <div className="py-[60px] text-center text-xs text-faint">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="py-[60px] text-center text-[13px] text-faint">No pending requests.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((p) => (
            <div key={p.id} className="rounded-2xl border border-gold/25 bg-card p-4">
              <div className="text-[15px] font-extrabold">{(p as any).customer?.name}</div>
              <div className="mt-0.5 text-xs text-muted">
                {p.service_name} · ${p.price}
              </div>
              <div className="mb-3.5 mt-2 flex gap-3.5">
                <div className="text-[12.5px] font-bold text-gold">{p.date}</div>
                <div className="text-[12.5px] font-bold text-gold">{p.time}</div>
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => approve(p)} className="flex-1 rounded-[10px] bg-goldsolid py-[11px] text-[13px] font-extrabold text-bg">
                  Approve
                </button>
                <button onClick={() => decline(p)} className="flex-1 rounded-[10px] border border-line/15 py-[11px] text-[13px] font-bold text-secondary">
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
