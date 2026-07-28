"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { confirmRedemption, fetchRedemption } from "@/lib/api";
import { Wordmark } from "@/components/Logo";
import { GoldButton } from "@/components/UI";
import type { RewardRedemption } from "@/lib/types";

export default function RedeemPage() {
  const supabase = createClient();
  const params = useParams<{ id: string }>();

  const [redemption, setRedemption] = useState<RewardRedemption | null>(null);
  const [viewerIsBarber, setViewerIsBarber] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  async function load() {
    const [r, { data: { user } }] = await Promise.all([fetchRedemption(supabase, params.id), supabase.auth.getUser()]);
    setRedemption(r);
    if (user) {
      setViewerId(user.id);
      const { data: viewerProfile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setViewerIsBarber(viewerProfile?.role === "barber");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function handleConfirm() {
    if (!redemption || !viewerId) return;
    setConfirming(true);
    try {
      await confirmRedemption(supabase, redemption, viewerId);
      await load();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="app-shell items-center justify-center px-6 text-center">
      <div className="mb-8">
        <Wordmark size={20} />
      </div>

      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : !redemption ? (
        <div className="text-sm text-muted">Couldn't find that redemption code.</div>
      ) : (
        <div className="w-full max-w-[360px] rounded-[20px] border border-gold/25 bg-card p-6">
          <div className="mb-1 font-headline text-lg">
            {redemption.customer?.name ?? "Customer"}
          </div>
          <div className="mb-5 text-xs text-muted">{redemption.points.toLocaleString()} points → Free Cut</div>

          {redemption.status === "used" ? (
            <div className="rounded-xl border border-line/[0.07] bg-inputbg p-4 text-[13px] text-secondary">
              ✅ Redeemed{redemption.used_at ? ` on ${new Date(redemption.used_at).toLocaleString()}` : ""}.
            </div>
          ) : viewerIsBarber ? (
            <GoldButton disabled={confirming} onClick={handleConfirm}>
              {confirming ? "Confirming…" : "Confirm & Redeem"}
            </GoldButton>
          ) : (
            <div className="rounded-xl border border-line/[0.07] bg-inputbg p-4 text-[13px] text-secondary">
              Show this screen to your barber — they'll confirm it to redeem your free cut.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
