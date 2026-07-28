"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppProvider, useApp } from "@/lib/context/AppContext";
import { Wordmark } from "@/components/Logo";
import { GhostButton } from "@/components/UI";

function PendingShell() {
  const router = useRouter();
  const { profile, loading, logout } = useApp();

  useEffect(() => {
    if (loading) return;
    if (!profile || profile.role !== "barber") router.push("/auth");
    else if (profile.status === "approved") router.push("/barber/requests");
  }, [loading, profile, router]);

  if (loading || !profile || profile.role !== "barber" || profile.status === "approved") {
    return (
      <div className="app-shell items-center justify-center">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    );
  }

  const rejected = profile.status === "rejected";

  return (
    <div className="app-shell items-center justify-center px-6 text-center">
      <Wordmark size={20} sub="BARBER" />
      <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-3xl">
        {rejected ? "✕" : "⏳"}
      </div>
      <div className="mt-6 font-headline text-[20px] leading-tight">
        {rejected ? "APPLICATION NOT APPROVED" : "APPLICATION UNDER REVIEW"}
      </div>
      <div className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
        {rejected
          ? "The shop owner didn't approve your barber application. Reach out to the shop directly if you think this is a mistake."
          : `Thanks for signing up, ${profile.name}. The shop owner is reviewing your application — you'll be able to take bookings as soon as you're approved.`}
      </div>
      <div className="mt-8 w-full max-w-xs">
        <GhostButton onClick={logout}>Log Out</GhostButton>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <AppProvider>
      <PendingShell />
    </AppProvider>
  );
}
