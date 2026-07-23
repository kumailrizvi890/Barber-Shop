"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { redeemReward } from "@/lib/api";
import { GhostButton, GoldButton } from "@/components/UI";

const GOAL = 5000;

export default function RewardsPage() {
  const supabase = createClient();
  const { profile, refreshNotifications, logout } = useApp();
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("rewards")
      .select("points")
      .eq("user_id", profile.id)
      .single()
      .then(({ data }) => {
        setPoints(data?.points ?? 0);
        setLoading(false);
      });
  }, [profile, supabase]);

  const pct = Math.min(100, Math.round((points / GOAL) * 100));
  const remaining = Math.max(0, GOAL - points);

  async function redeem() {
    if (!profile || points < GOAL) return;
    await redeemReward(supabase, profile.id, points);
    setPoints((p) => p - GOAL);
    await refreshNotifications();
  }

  return (
    <div className="px-5 pb-7">
      <div className="mb-[18px] font-headline text-[19px]">REWARDS</div>

      <div className="mb-5 rounded-[20px] border border-gold/30 p-[22px] text-center" style={{ background: "linear-gradient(160deg,#1a1a1a,#0d0d0d)" }}>
        <div className="text-[11.5px] font-bold tracking-wide text-muted">YOUR POINTS</div>
        <div className="my-1.5 font-headline text-[40px] text-gold">{loading ? "—" : points}</div>
        <div className="mb-3.5 text-xs text-secondary">
          {points >= GOAL ? "You've unlocked a free cut!" : `${remaining} more points to a free cut`}
        </div>
        <div className="h-2.5 overflow-hidden rounded-md bg-[#232323]">
          <div
            className="h-full rounded-md transition-all duration-500"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg,#a8842a,#D4AF37)" }}
          />
        </div>
        <div className="mt-[18px]">
          <GoldButton disabled={points < GOAL} onClick={redeem}>
            Redeem 5000 pts → Free Cut
          </GoldButton>
        </div>
      </div>

      <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-muted">HOW IT WORKS</div>
      <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-card p-4 text-[12.5px] leading-snug text-secondary">
        <div>
          • Earn <span className="font-bold text-gold">10 points per $1</span> spent, credited after you rate your cut.
        </div>
        <div>• 5000 points unlocks a free cut on your next visit.</div>
      </div>

      <GhostButton onClick={logout}>Log Out</GhostButton>
    </div>
  );
}
