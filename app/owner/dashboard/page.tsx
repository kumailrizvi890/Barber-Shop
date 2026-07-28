"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchShopStats, type ShopStats } from "@/lib/api";
import { Card } from "@/components/UI";
import { LiveBookingCounter } from "@/components/LiveBookingCounter";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function OwnerDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShopStats(supabase)
      .then(setStats)
      .finally(() => setLoading(false));
  }, [supabase]);

  return (
    <div>
      <div className="mb-1 font-headline text-[19px]">DASHBOARD</div>
      <div className="mb-[18px] text-xs text-muted">Shop-wide performance at a glance</div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <LiveBookingCounter label="Total Online Bookings" />
        <Card className="px-2 py-4 text-center">
          <div className="font-headline text-[20px] text-gold">{loading ? "—" : stats?.crewSize ?? 0}</div>
          <div className="mt-1 text-[10px] text-muted">Approved Barbers</div>
        </Card>
      </div>

      <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">REVENUE (COMPLETED CUTS)</div>
      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <Card className="px-2 py-4 text-center">
          <div className="font-headline text-[17px] text-gold">{loading ? "—" : money(stats?.revenue.month ?? 0)}</div>
          <div className="mt-1 text-[10px] text-muted">This Month</div>
        </Card>
        <Card className="px-2 py-4 text-center">
          <div className="font-headline text-[17px] text-gold">{loading ? "—" : money(stats?.revenue.ytd ?? 0)}</div>
          <div className="mt-1 text-[10px] text-muted">Year to Date</div>
        </Card>
        <Card className="px-2 py-4 text-center">
          <div className="font-headline text-[17px] text-gold">{loading ? "—" : money(stats?.revenue.total ?? 0)}</div>
          <div className="mt-1 text-[10px] text-muted">All Time</div>
        </Card>
      </div>

      {!loading && stats && stats.pendingBarbers > 0 && (
        <Link
          href="/owner/crew"
          className="mb-5 flex items-center justify-between rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-[14px]"
        >
          <div>
            <div className="text-[13.5px] font-bold text-gold">
              {stats.pendingBarbers} barber{stats.pendingBarbers === 1 ? "" : "s"} awaiting approval
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted">Review applications to add them to The Crew</div>
          </div>
          <div className="text-gold">→</div>
        </Link>
      )}

      <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">BOOKINGS</div>
      <Card className="px-4 py-[14px]">
        <div className="flex items-center justify-between">
          <div className="text-[13.5px] text-secondary">Total bookings made</div>
          <div className="text-[15px] font-extrabold text-gold">{loading ? "—" : stats?.totalBookings ?? 0}</div>
        </div>
      </Card>
    </div>
  );
}
