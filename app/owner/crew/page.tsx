"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { approveBarber, rejectBarber } from "@/lib/api";
import { BarberAvatar, Card } from "@/components/UI";
import type { Profile } from "@/lib/types";

export default function OwnerCrewPage() {
  const supabase = createClient();
  const router = useRouter();
  const [pending, setPending] = useState<Profile[]>([]);
  const [approved, setApproved] = useState<Profile[]>([]);
  const [rejected, setRejected] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").eq("role", "barber").order("name");
    const all = (data as Profile[]) ?? [];
    setPending(all.filter((b) => b.status === "pending"));
    setApproved(all.filter((b) => b.status === "approved"));
    setRejected(all.filter((b) => b.status === "rejected"));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(id: string) {
    setBusy(id);
    await approveBarber(supabase, id);
    await load();
    setBusy(null);
  }
  async function reject(id: string) {
    setBusy(id);
    await rejectBarber(supabase, id);
    await load();
    setBusy(null);
  }

  if (loading) return <div className="py-[60px] text-center text-xs text-faint">Loading…</div>;

  return (
    <div>
      <div className="mb-1 font-headline text-[19px]">CREW</div>
      <div className="mb-[18px] text-xs text-muted">Approve barber applications and manage the crew</div>

      {pending.length > 0 && (
        <div className="mb-6">
          <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-gold">PENDING APPLICATIONS · {pending.length}</div>
          <div className="flex flex-col gap-2.5">
            {pending.map((b) => (
              <div key={b.id} className="rounded-2xl border border-gold/25 bg-card p-4">
                <div className="flex items-center gap-3">
                  <BarberAvatar initials={b.initials} size={44} rounded={11} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-bold">{b.name}</div>
                    {b.location && <div className="truncate text-[11.5px] text-muted">{b.location}</div>}
                    {b.email && <div className="truncate text-[11.5px] text-secondary">{b.email}</div>}
                  </div>
                </div>
                {b.bio && <div className="mt-2.5 text-[12px] leading-relaxed text-secondary">{b.bio}</div>}
                <div className="mt-3.5 flex gap-2.5">
                  <button
                    disabled={busy === b.id}
                    onClick={() => approve(b.id)}
                    className="flex-1 rounded-[10px] bg-goldsolid py-[11px] text-[13px] font-extrabold text-bg disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    disabled={busy === b.id}
                    onClick={() => reject(b.id)}
                    className="flex-1 rounded-[10px] border border-line/15 py-[11px] text-[13px] font-bold text-secondary disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-2.5 flex items-baseline justify-between">
        <div className="text-[11.5px] font-bold tracking-wide text-muted">THE CREW · {approved.length}</div>
      </div>
      <div className="flex flex-col gap-2.5">
        {approved.map((b) => (
          <div
            key={b.id}
            onClick={() => router.push(`/owner/crew/${b.id}`)}
            className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-line/[0.07] bg-card p-[12px_14px]"
          >
            <BarberAvatar initials={b.initials} size={48} rounded={12} />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-bold">{b.name}</div>
              <div className="mt-0.5 text-xs text-muted">{b.location}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[12.5px] font-bold text-gold">★ {b.rating}</div>
              <div className="text-[10.5px] text-faint">{b.cuts_done} cuts</div>
            </div>
            <button
              disabled={busy === b.id}
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Remove ${b.name} from the crew? They'll stop showing up for new bookings until re-approved.`)) {
                  reject(b.id);
                }
              }}
              title="Remove from crew"
              className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-error/10 hover:text-error disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ))}
        {approved.length === 0 && <div className="py-8 text-center text-xs text-faint">No approved barbers yet.</div>}
      </div>

      {rejected.length > 0 && (
        <div className="mt-6">
          <div className="mb-2.5 text-[11.5px] font-bold tracking-wide text-muted">REJECTED · {rejected.length}</div>
          <div className="flex flex-col gap-2">
            {rejected.map((b) => (
              <Card key={b.id} className="flex items-center justify-between p-3.5">
                <div className="text-[13px] font-bold text-muted">{b.name}</div>
                <button
                  disabled={busy === b.id}
                  onClick={() => approve(b.id)}
                  className="rounded-lg border border-line/15 px-3 py-1.5 text-[11.5px] font-bold text-secondary disabled:opacity-50"
                >
                  Approve instead
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
