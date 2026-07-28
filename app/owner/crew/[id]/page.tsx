"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchBarberStats, type BarberStats } from "@/lib/api";
import { BarberAvatar, Card, StatusBadge } from "@/components/UI";
import type { Booking } from "@/lib/types";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function OwnerBarberDetailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [stats, setStats] = useState<BarberStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchBarberStats(supabase, params.id),
      supabase
        .from("bookings")
        .select("*, customer:customer_id(name)")
        .eq("barber_id", params.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(40),
    ]).then(([s, { data }]) => {
      setStats(s);
      setBookings((data as any) ?? []);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) return <div className="py-[60px] text-center text-xs text-faint">Loading…</div>;
  if (!stats) return <div className="py-[60px] text-center text-xs text-faint">Barber not found.</div>;

  const { profile, revenue } = stats;

  return (
    <div>
      <button onClick={() => router.push("/owner/crew")} className="mb-4 text-[12.5px] font-bold text-muted hover:text-secondary">
        ← Back to Crew
      </button>

      <div className="mb-5 flex items-center gap-3.5">
        <BarberAvatar initials={profile.initials} size={56} rounded={14} />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-extrabold">{profile.name}</div>
          <div className="mt-0.5 text-[12px] text-muted">{profile.location}</div>
          <div className="mt-1 text-[12.5px] font-bold text-gold">★ {profile.rating}</div>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <Card className="px-2 py-3.5 text-center">
          <div className="font-headline text-[18px] text-gold">{stats.totalBookings}</div>
          <div className="mt-1 text-[10px] text-muted">Total Bookings</div>
        </Card>
        <Card className="px-2 py-3.5 text-center">
          <div className="font-headline text-[18px] text-gold">{stats.completedBookings}</div>
          <div className="mt-1 text-[10px] text-muted">Cuts Completed</div>
        </Card>
      </div>

      <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">REVENUE GENERATED</div>
      <div className="mb-6 grid grid-cols-3 gap-2.5">
        <Card className="px-2 py-4 text-center">
          <div className="font-headline text-[16px] text-gold">{money(revenue.month)}</div>
          <div className="mt-1 text-[10px] text-muted">This Month</div>
        </Card>
        <Card className="px-2 py-4 text-center">
          <div className="font-headline text-[16px] text-gold">{money(revenue.ytd)}</div>
          <div className="mt-1 text-[10px] text-muted">Year to Date</div>
        </Card>
        <Card className="px-2 py-4 text-center">
          <div className="font-headline text-[16px] text-gold">{money(revenue.total)}</div>
          <div className="mt-1 text-[10px] text-muted">All Time</div>
        </Card>
      </div>

      <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-muted">BOOKINGS</div>
      <div className="flex flex-col gap-2">
        {bookings.map((b) => (
          <Card key={b.id} className="flex items-center justify-between p-3.5">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-bold">{(b as any).customer?.name ?? "Guest"}</div>
              <div className="mt-0.5 text-[11.5px] text-muted">
                {b.service_name} · {b.date} {b.time}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <div className="text-[12.5px] font-bold text-gold">${b.price}</div>
              <StatusBadge status={b.status} />
            </div>
          </Card>
        ))}
        {bookings.length === 0 && <div className="py-8 text-center text-xs text-faint">No bookings yet.</div>}
      </div>
    </div>
  );
}
