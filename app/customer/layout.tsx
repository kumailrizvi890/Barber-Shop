"use client";

import { AppProvider, useApp } from "@/lib/context/AppContext";
import { Wordmark } from "@/components/BarberPole";
import { NotificationBell } from "@/components/NotificationBell";
import { TabBar } from "@/components/TabBar";

function Shell({ children }: { children: React.ReactNode }) {
  const { profile, notifications, loading, markRead } = useApp();

  if (loading) {
    return (
      <div className="app-shell items-center justify-center">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="relative flex shrink-0 items-center justify-between px-5 pb-1 pt-14">
        <Wordmark size={17} />
        {profile && <NotificationBell notifications={notifications} onMarkRead={markRead} />}
      </div>
      <div className="flex-1 overflow-auto pt-3.5">{children}</div>
      <TabBar role="customer" />
    </div>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <Shell>{children}</Shell>
    </AppProvider>
  );
}
