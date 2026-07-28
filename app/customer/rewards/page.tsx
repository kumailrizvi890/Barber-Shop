"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { createRedemption } from "@/lib/api";
import { GhostButton, GoldButton } from "@/components/UI";
import { RedeemQRModal } from "@/components/RedeemQRModal";
import type { RewardRedemption } from "@/lib/types";

const GOAL = 5000;

export default function RewardsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { profile, isAnonymous, logout } = useApp();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingRedemption, setPendingRedemption] = useState<RewardRedemption | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const load = useCallback(async () => {
    if (!profile) {
      setLoading(false);
      return;
    }
    const [{ data: rewardsRow }, { data: pending }] = await Promise.all([
      supabase.from("rewards").select("points").eq("user_id", profile.id).single(),
      supabase.from("reward_redemptions").select("*").eq("user_id", profile.id).eq("status", "pending").maybeSingle(),
    ]);
    setPoints(rewardsRow?.points ?? 0);
    setPendingRedemption((pending as RewardRedemption) ?? null);
    setLoading(false);
  }, [profile, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  if (!loading && !profile) {
    return (
      <div className="px-5 pb-7">
        <div className="mb-[18px] font-headline text-[19px]">REWARDS</div>
        <div className="rounded-[20px] border border-gold/25 p-[26px_20px] text-center" style={{ background: "linear-gradient(160deg, rgb(var(--color-surface2)), rgb(var(--color-cardalt)))" }}>
          <div className="mb-2 text-[13px] font-bold">You're browsing as a guest</div>
          <div className="mb-5 text-xs leading-relaxed text-secondary">
            Book your first cut and create an account to start earning 10 points per $1 — 5000 points unlocks a free cut.
          </div>
          <GoldButton onClick={() => router.push("/customer/book")}>Book Your First Cut</GoldButton>
        </div>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((points / GOAL) * 100));
  const remaining = Math.max(0, GOAL - points);

  async function redeem() {
    if (!profile || points < GOAL || redeeming) return;
    setRedeeming(true);
    try {
      const redemption = await createRedemption(supabase, profile.id, GOAL);
      setPendingRedemption(redemption);
      setShowQR(true);
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="px-5 pb-7">
      <div className="mb-[18px] font-headline text-[19px]">REWARDS</div>

      <div className="mb-5 rounded-[20px] border border-gold/30 p-[22px] text-center" style={{ background: "linear-gradient(160deg, rgb(var(--color-surface2)), rgb(var(--color-cardalt)))" }}>
        <div className="text-[11.5px] font-bold tracking-wide text-muted">YOUR POINTS</div>
        <div className="my-1.5 font-headline text-[40px] text-gold">{loading ? "—" : points}</div>
        <div className="mb-3.5 text-xs text-secondary">
          {pendingRedemption
            ? "Free cut ready — show your QR code to your barber"
            : points >= GOAL
            ? "You've unlocked a free cut!"
            : `${remaining} more points to a free cut`}
        </div>
        <div className="h-2.5 overflow-hidden rounded-md bg-surface2">
          <div
            className="h-full rounded-md transition-all duration-500"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, rgb(var(--color-golddark)), rgb(var(--color-goldsolid)))" }}
          />
        </div>
        <div className="mt-[18px]">
          {pendingRedemption ? (
            <GoldButton onClick={() => setShowQR(true)}>View My QR Code</GoldButton>
          ) : (
            <GoldButton disabled={points < GOAL || redeeming} onClick={redeem}>
              {redeeming ? "Preparing…" : "Redeem 5000 pts → Free Cut"}
            </GoldButton>
          )}
        </div>
      </div>

      <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-muted">HOW IT WORKS</div>
      <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-line/[0.07] bg-card p-4 text-[12.5px] leading-snug text-secondary">
        <div>
          • Earn <span className="font-bold text-gold">10 points per $1</span> spent, credited as soon as your barber marks the appointment complete.
        </div>
        <div>• 5000 points unlocks a free cut — redeeming gives you a QR code, and your barber scans it to confirm at checkout. Points aren't deducted until then.</div>
      </div>

      {isAnonymous && (
        <div className="mb-5 rounded-2xl border border-gold/25 bg-card p-4 text-[12.5px] leading-snug text-secondary">
          You're booking as a guest — your points are saved, but add a phone number and password to keep this account for next time.
        </div>
      )}

      <GhostButton onClick={logout}>Log Out</GhostButton>

      {showQR && pendingRedemption && (
        <RedeemQRModal redemptionId={pendingRedemption.id} points={pendingRedemption.points} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}
