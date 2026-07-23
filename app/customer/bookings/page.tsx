"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { rateBooking } from "@/lib/api";
import { GoldButton, StarRow, StatusBadge, statusStripeColor } from "@/components/UI";
import type { Booking } from "@/lib/types";

export default function BookingsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { profile, refreshNotifications } = useApp();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("bookings")
      .select("*, barber:barber_id(name, initials, location)")
      .eq("customer_id", profile.id)
      .order("created_at", { ascending: false });
    setBookings((data as any) ?? []);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function rate(b: Booking, stars: number) {
    await rateBooking(supabase, b, stars);
    await refreshNotifications();
    load();
  }

  if (loading) return <div className="px-5 py-10 text-center text-xs text-faint">Loading…</div>;

  return (
    <div className="px-5 pb-7">
      <div className="mb-[18px] font-headline text-[19px]">MY APPOINTMENTS</div>

      {bookings.length === 0 ? (
        <div className="py-[60px] text-center text-faint">
          <div className="mb-3.5 text-[13px]">No appointments yet.</div>
          <button onClick={() => router.push("/customer/book")} className="rounded-xl bg-gold px-[22px] py-3 text-[13.5px] font-extrabold text-bg">
            Book your first cut
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookings.map((a) => {
            const needsRating = a.status === "completed" && !a.rating;
            return (
              <div key={a.id} className="relative overflow-hidden rounded-2xl border border-gold/20 bg-card p-4">
                <div className="absolute bottom-0 left-0 top-0 w-[5px]" style={{ background: statusStripeColor(a.status) }} />
                <div className="flex items-start justify-between pl-1.5">
                  <div>
                    <div className="text-[15px] font-extrabold">{a.barber?.name}</div>
                    <div className="mt-0.5 text-xs text-muted">{a.service_name}</div>
                    <div className="mt-2.5 flex gap-3.5">
                      <div className="text-[12.5px] font-bold text-gold">{a.date}</div>
                      <div className="text-[12.5px] font-bold text-gold">{a.time}</div>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                {needsRating && (
                  <div className="mt-3 border-t border-white/[0.07] pl-1.5 pt-3">
                    <div className="mb-2 text-[11.5px] text-muted">How was your cut? Rate it:</div>
                    <StarRow value={0} onRate={(n) => rate(a, n)} />
                  </div>
                )}
                {a.rating ? (
                  <div className="mt-3 border-t border-white/[0.07] pl-1.5 pt-3 text-[13px] font-bold text-gold">
                    {"★".repeat(a.rating)} <span className="font-medium text-muted">rated</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
