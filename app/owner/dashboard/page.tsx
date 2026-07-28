"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { fetchShopStats, fetchShopAnalytics, type ShopStats, type ShopAnalytics } from "@/lib/api";
import { Card } from "@/components/UI";
import { LiveBookingCounter } from "@/components/LiveBookingCounter";
import { BarChart, HBarChart, DonutChart } from "@/components/charts";
import { useCountUp } from "@/lib/useCountUp";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function Stat({ value, label, delay = 0 }: { value: string; label: string; delay?: number }) {
  return (
    <Card className="animate-fadeInUp px-2 py-4 text-center" style={{ animationDelay: `${delay}ms` }}>
      <div className="font-headline text-[17px] text-gold">{value}</div>
      <div className="mt-1 text-[10px] text-muted">{label}</div>
    </Card>
  );
}

function Section({ title, delay, children }: { title: string; delay: number; children: React.ReactNode }) {
  return (
    <div className="animate-fadeInUp mb-5" style={{ animationDelay: `${delay}ms` }}>
      <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-muted">{title}</div>
      <Card className="px-4 py-4">{children}</Card>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [analytics, setAnalytics] = useState<ShopAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchShopStats(supabase), fetchShopAnalytics(supabase)])
      .then(([s, a]) => {
        setStats(s);
        setAnalytics(a);
      })
      .finally(() => setLoading(false));
  }, [supabase]);

  const monthRevenue = useCountUp(stats?.revenue.month ?? 0);
  const ytdRevenue = useCountUp(stats?.revenue.ytd ?? 0);
  const totalRevenue = useCountUp(stats?.revenue.total ?? 0);
  const avgTicket = useCountUp(analytics?.avgTicket ?? 0);
  const totalBookings = useCountUp(stats?.totalBookings ?? 0);
  const loyaltyPoints = useCountUp(analytics?.loyaltyPointsOutstanding ?? 0);
  const completionPct = useCountUp((analytics?.completionRate ?? 0) * 100);

  return (
    <div>
      <div className="mb-1 font-headline text-[19px]">DASHBOARD</div>
      <div className="mb-[18px] text-xs text-muted">Shop-wide performance at a glance</div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <LiveBookingCounter label="Total Online Bookings" />
        <Card className="animate-fadeInUp px-2 py-4 text-center">
          <div className="font-headline text-[20px] text-gold">{loading ? "—" : stats?.crewSize ?? 0}</div>
          <div className="mt-1 text-[10px] text-muted">Approved Barbers</div>
        </Card>
      </div>

      <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">REVENUE (COMPLETED CUTS)</div>
      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <Stat value={loading ? "—" : money(monthRevenue)} label="This Month" delay={0} />
        <Stat value={loading ? "—" : money(ytdRevenue)} label="Year to Date" delay={40} />
        <Stat value={loading ? "—" : money(totalRevenue)} label="All Time" delay={80} />
      </div>

      {!loading && stats && stats.pendingBarbers > 0 && (
        <Link
          href="/owner/crew"
          className="animate-fadeInUp mb-5 flex items-center justify-between rounded-2xl border border-gold/25 bg-gold/[0.06] px-4 py-[14px]"
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

      <div className="mb-5 grid grid-cols-3 gap-2.5">
        <Stat value={loading ? "—" : money(avgTicket)} label="Avg Ticket" delay={0} />
        <Stat value={loading || analytics?.completionRate === null ? "—" : `${Math.round(completionPct)}%`} label="Show-Up Rate" delay={40} />
        <Stat value={loading ? "—" : analytics?.busiestDay?.label ?? "—"} label="Busiest Day" delay={80} />
      </div>

      <Section title="REVENUE — LAST 8 WEEKS" delay={0}>
        {!loading && analytics ? (
          <BarChart data={analytics.revenueTrend} valueLabel={money} />
        ) : (
          <div className="py-6 text-center text-xs text-faint">Loading…</div>
        )}
      </Section>

      <Section title="BOOKING STATUS" delay={40}>
        {!loading && analytics && analytics.statusBreakdown.length > 0 ? (
          <DonutChart data={analytics.statusBreakdown} />
        ) : (
          <div className="py-6 text-center text-xs text-faint">{loading ? "Loading…" : "No bookings yet."}</div>
        )}
      </Section>

      <Section title="TOP BARBERS — REVENUE" delay={80}>
        {!loading && analytics && analytics.topBarbers.length > 0 ? (
          <HBarChart data={analytics.topBarbers.map((b) => ({ label: b.name, value: b.revenue }))} valueLabel={money} />
        ) : (
          <div className="py-6 text-center text-xs text-faint">{loading ? "Loading…" : "No completed cuts yet."}</div>
        )}
      </Section>

      <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">BOOKINGS &amp; LOYALTY</div>
      <div className="grid grid-cols-2 gap-2.5">
        <Stat value={loading ? "—" : totalBookings.toLocaleString(undefined, { maximumFractionDigits: 0 })} label="Total Bookings" />
        <Stat value={loading ? "—" : `${Math.round(loyaltyPoints).toLocaleString()} pts`} label="Loyalty Points Outstanding" />
      </div>
    </div>
  );
}
