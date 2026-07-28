"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { fetchBarbers, priceLabel, specialtyLabel, type BarberWithServices } from "@/lib/barbers";
import { BarberLottie } from "@/components/BarberLottie";
import { BarberAvatar } from "@/components/UI";

export default function CustomerHomePage() {
  const supabase = createClient();
  const router = useRouter();
  const { profile } = useApp();
  const [barbers, setBarbers] = useState<BarberWithServices[]>([]);

  useEffect(() => {
    fetchBarbers(supabase).then(setBarbers).catch(console.error);
  }, [supabase]);

  function goBook(barberId?: string) {
    if (barberId) sessionStorage.setItem("fh_book_barber", barberId);
    router.push("/customer/book");
  }

  function viewProfile(barberId: string) {
    router.push(`/customer/barber/${barberId}`);
  }

  return (
    <div className="px-5 pb-7">
      <div className="relative mb-5 overflow-hidden rounded-[20px] border border-gold/25 p-[26px_20px]" style={{ background: "linear-gradient(160deg, rgb(var(--color-surface2)), rgb(var(--color-cardalt)))" }}>
        <div className="relative flex items-center gap-[18px]">
          <div className="animate-floatSlow">
            <BarberLottie height={104} />
          </div>
          <div className="flex-1">
            <div className="font-headline text-[22px] leading-[1.05] tracking-tight">
              SHARP
              <br />
              CUTS,
              <br />
              <span className="text-gold">FAST BOOK</span>
            </div>
            <div className="mt-2 text-xs leading-snug text-secondary">
              Hey {profile?.name ?? "there"} — earn points on every cut.
            </div>
          </div>
        </div>
        <button
          onClick={() => goBook()}
          className="mt-[18px] w-full animate-pulseGold rounded-xl bg-goldsolid py-[14px] text-[15px] font-extrabold text-bg"
        >
          Book Now →
        </button>
      </div>

      <div className="mb-3 flex items-baseline justify-between">
        <div className="font-headline text-[15px] tracking-wide">THE CREW</div>
        <div className="text-[11.5px] text-muted">{barbers.length} barbers</div>
      </div>

      <div className="flex flex-col gap-2.5">
        {barbers.map((b) => (
          <div
            key={b.id}
            onClick={() => viewProfile(b.id)}
            className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-line/[0.07] bg-card p-[12px_14px]"
          >
            <BarberAvatar initials={b.initials} size={52} rounded={12} />
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-bold">{b.name}</div>
              <div className="mt-0.5 text-xs text-muted">{specialtyLabel(b)}</div>
              <div className="mt-px text-[11px] text-faint">{b.location}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[12.5px] font-bold text-gold">★ {b.rating}</div>
              <div className="text-[10.5px] text-faint">{priceLabel(b)}</div>
            </div>
          </div>
        ))}
        {barbers.length === 0 && <div className="py-10 text-center text-xs text-faint">No barbers yet — check back soon.</div>}
      </div>
    </div>
  );
}
