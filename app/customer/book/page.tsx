"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { fetchBarbers, priceLabel, specialtyLabel, type BarberWithServices } from "@/lib/barbers";
import { TIME_SLOTS, next7Days, initialsFor } from "@/lib/slots";
import { toE164 } from "@/lib/phone";
import { requestBooking } from "@/lib/api";
import { BarberAvatar, GoldButton, GhostButton } from "@/components/UI";

type Step = 1 | 2 | 3 | 4;

// Deterministic pseudo-unavailability so the demo has some greyed-out slots
// even before real bookings exist. Replace with a live join against
// `bookings` for production-accurate availability.
function seededUnavailable(barberId: string, dateIdx: number, slotIdx: number) {
  let hash = 0;
  for (const ch of barberId) hash = (hash * 31 + ch.charCodeAt(0)) % 1000;
  return (hash * 7 + dateIdx * 13 + slotIdx * 5) % 11 < 3;
}

export default function BookPage() {
  const supabase = createClient();
  const router = useRouter();
  const { profile, isAnonymous, refreshNotifications, refreshProfile, ensureGuestProfile } = useApp();

  const [barbers, setBarbers] = useState<BarberWithServices[]>([]);
  const [step, setStep] = useState<Step>(1);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [dateIdx, setDateIdx] = useState(0);
  const [time, setTime] = useState<string | null>(null);
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const [gName, setGName] = useState("");
  const [gPhone, setGPhone] = useState("");
  const [gPassword, setGPassword] = useState("");
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [converted, setConverted] = useState(false);

  const dates = useMemo(() => next7Days(), []);
  const selectedBarber = barbers.find((b) => b.id === barberId) ?? null;
  const selectedService = selectedBarber?.barber_services.find((s) => s.id === serviceId) ?? null;

  useEffect(() => {
    fetchBarbers(supabase).then((list) => {
      setBarbers(list);
      const pending = sessionStorage.getItem("fh_book_barber");
      if (pending) {
        sessionStorage.removeItem("fh_book_barber");
        const b = list.find((x) => x.id === pending);
        if (b) {
          setBarberId(b.id);
          setServiceId(b.barber_services[0]?.id ?? null);
          setStep(2);
        }
      }
    });
  }, [supabase]);

  useEffect(() => {
    if (!barberId) return;
    supabase
      .from("availability")
      .select("weekday, slot_index, blocked")
      .eq("barber_id", barberId)
      .eq("blocked", true)
      .then(({ data }) => {
        const set = new Set<string>();
        (data ?? []).forEach((r: any) => set.add(`${r.weekday}_${r.slot_index}`));
        setBlockedSet(set);
      });
  }, [barberId, supabase]);

  function pickBarber(b: BarberWithServices) {
    setBarberId(b.id);
    setServiceId(b.barber_services[0]?.id ?? null);
    setTime(null);
    setStep(2);
  }

  function isUnavailable(slotIdx: number) {
    if (!barberId) return false;
    const weekday = dates[dateIdx].weekday;
    if (blockedSet.has(`${weekday}_${slotIdx}`)) return true;
    return seededUnavailable(barberId, dateIdx, slotIdx);
  }

  async function confirmBooking() {
    if (!selectedBarber || !selectedService || !time) return;
    setSubmitting(true);
    try {
      const bookingProfile = await ensureGuestProfile();
      await requestBooking(supabase, {
        customerId: bookingProfile.id,
        customerName: bookingProfile.name,
        barberId: selectedBarber.id,
        barberName: selectedBarber.name,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        date: dates[dateIdx].date,
        dateLabel: dates[dateIdx].label,
        time,
      });
      await refreshNotifications();
      if (isAnonymous || bookingProfile.name === "Guest") {
        setStep(4);
      } else {
        router.push("/customer/bookings");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  }

  async function convertGuestAccount() {
    if (!gPhone.trim() || !gPassword.trim()) return;
    setConverting(true);
    setConvertError(null);
    try {
      const { error } = await supabase.auth.updateUser({ phone: toE164(gPhone), password: gPassword });
      if (error) throw error;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const name = gName.trim() || "Guest";
        await supabase
          .from("profiles")
          .update({ name, phone: toE164(gPhone), initials: initialsFor(name) })
          .eq("id", user.id);
      }
      await refreshProfile();
      setConverted(true);
    } catch (e: any) {
      setConvertError(e.message ?? "Something went wrong.");
    } finally {
      setConverting(false);
    }
  }

  const stepLabel =
    step === 1
      ? "Step 1 of 3 — Pick your barber"
      : step === 2
      ? "Step 2 of 3 — Service, date & time"
      : step === 3
      ? "Step 3 of 3 — Confirm"
      : "Booked! Save your spot";

  return (
    <div className="px-5 pb-7">
      <div className="mb-1 font-headline text-[19px]">BOOK A CHAIR</div>
      {step !== 4 && <div className="mb-[18px] text-xs text-muted">{stepLabel}</div>}

      {step === 1 && (
        <div className="flex flex-col gap-2.5">
          {barbers.map((b) => (
            <div
              key={b.id}
              onClick={() => pickBarber(b)}
              className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-white/[0.07] bg-card p-[12px_14px]"
            >
              <BarberAvatar initials={b.initials} size={44} rounded={11} />
              <div className="flex-1">
                <div className="text-sm font-bold">{b.name}</div>
                <div className="text-[11.5px] text-muted">
                  {specialtyLabel(b)} · {priceLabel(b)}
                </div>
              </div>
              <div className="text-xs font-bold text-gold">★ {b.rating}</div>
            </div>
          ))}
        </div>
      )}

      {step === 2 && selectedBarber && (
        <div>
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-card p-[10px_12px]">
            <BarberAvatar initials={selectedBarber.initials} size={34} rounded={9} />
            <div className="flex-1 text-[13px] font-bold">{selectedBarber.name}</div>
            <div onClick={() => setStep(1)} className="cursor-pointer text-[11px] text-gold">Change</div>
          </div>

          <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">SELECT SERVICE</div>
          <div className="mb-5 flex flex-col gap-2">
            {selectedBarber.barber_services.map((s) => {
              const active = s.id === serviceId;
              return (
                <div
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className="flex cursor-pointer items-center justify-between rounded-[11px] p-[11px_14px]"
                  style={{
                    background: active ? "rgba(212,175,55,0.1)" : "#1c1c1c",
                    border: `1px solid ${active ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div className="text-[13px] font-bold" style={{ color: active ? "#D4AF37" : "#f5f5f0" }}>{s.name}</div>
                  <div className="text-[13px] font-extrabold text-gold">${s.price}</div>
                </div>
              );
            })}
          </div>

          <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">SELECT DATE</div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1.5">
            {dates.map((d, i) => {
              const active = i === dateIdx;
              return (
                <div
                  key={d.date}
                  onClick={() => {
                    setDateIdx(i);
                    setTime(null);
                  }}
                  className="w-[52px] shrink-0 cursor-pointer rounded-xl py-2.5 text-center"
                  style={{
                    background: active ? "rgba(212,175,55,0.12)" : "#1c1c1c",
                    border: `1px solid ${active ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div className="text-[10px] font-semibold tracking-wide" style={{ color: active ? "#D4AF37" : "#8f8f89" }}>
                    {d.label.split(" ")[0].toUpperCase()}
                  </div>
                  <div className="mt-0.5 text-base font-extrabold" style={{ color: active ? "#D4AF37" : "#f5f5f0" }}>
                    {d.label.split(" ")[1]}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">AVAILABLE TIMES</div>
          <div className="mb-[22px] grid grid-cols-3 gap-2.5">
            {TIME_SLOTS.map((label, i) => {
              const unavailable = isUnavailable(i);
              const active = time === label;
              return (
                <div
                  key={label}
                  onClick={() => !unavailable && setTime(label)}
                  className="rounded-[10px] py-3 text-center text-[13px] font-bold"
                  style={{
                    background: active ? "#D4AF37" : unavailable ? "#161616" : "#1c1c1c",
                    color: active ? "#0a0a0a" : unavailable ? "#4a4a46" : "#f5f5f0",
                    border: `1px solid ${active ? "#D4AF37" : "rgba(255,255,255,0.08)"}`,
                    cursor: unavailable ? "not-allowed" : "pointer",
                    opacity: unavailable ? 0.5 : 1,
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          <GoldButton disabled={!time} onClick={() => time && setStep(3)}>
            Continue
          </GoldButton>
        </div>
      )}

      {step === 3 && selectedBarber && selectedService && (
        <div>
          <div className="my-2.5 mb-[22px] flex justify-center">
            <div
              className="flex h-[72px] w-[72px] animate-checkPop items-center justify-center rounded-full"
              style={{ background: "radial-gradient(circle,#D4AF37,#a8842a)" }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="mb-1 text-center font-headline text-lg">CONFIRM YOUR SLOT</div>
          <div className="mb-[22px] text-center text-xs text-muted">Your barber will approve the request before it's locked in</div>

          <div className="mb-[22px] rounded-2xl border border-gold/25 bg-card p-[18px]">
            {[
              ["Barber", selectedBarber.name],
              ["Service", `${selectedService.name} · $${selectedService.price}`],
              ["Date", dates[dateIdx].label],
              ["Time", time ?? ""],
            ].map(([label, value], i) => (
              <div key={label} className={"flex justify-between py-[9px]" + (i < 3 ? " border-b border-white/[0.07]" : "")}>
                <span className="text-[12.5px] text-muted">{label}</span>
                <span className="text-[13px] font-bold" style={label === "Time" ? { color: "#D4AF37" } : undefined}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-2.5">
            <GoldButton disabled={submitting} onClick={confirmBooking}>
              {submitting ? "Requesting…" : "Request Booking"}
            </GoldButton>
          </div>
          <GhostButton onClick={() => setStep(2)}>Back</GhostButton>
        </div>
      )}

      {step === 4 && (
        <div>
          <div className="my-2.5 mb-[22px] flex justify-center">
            <div
              className="flex h-[72px] w-[72px] animate-checkPop items-center justify-center rounded-full"
              style={{ background: "radial-gradient(circle,#D4AF37,#a8842a)" }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#0a0a0a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {converted ? (
            <>
              <div className="mb-1 text-center font-headline text-lg">YOU'RE ALL SET</div>
              <div className="mb-[22px] text-center text-xs text-muted">
                Your appointment is saved and you're earning points on every visit.
              </div>
              <GoldButton onClick={() => router.push("/customer/bookings")}>View My Appointments</GoldButton>
            </>
          ) : (
            <>
              <div className="mb-1 text-center font-headline text-lg">REQUEST SENT!</div>
              <div className="mb-[22px] text-center text-xs leading-relaxed text-muted">
                Save this appointment and start earning 10 points per $1 toward a free cut — just add your name, phone, and a password.
              </div>

              <input
                className="mb-3 w-full box-border rounded-xl border border-white/10 bg-inputbg px-4 py-[14px] text-sm text-primary outline-none placeholder:text-[#5a5a55]"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                placeholder="Your name"
              />
              <input
                className="mb-3 w-full box-border rounded-xl border border-white/10 bg-inputbg px-4 py-[14px] text-sm text-primary outline-none placeholder:text-[#5a5a55]"
                value={gPhone}
                onChange={(e) => setGPhone(e.target.value)}
                placeholder="Phone number"
                type="tel"
              />
              <input
                className="mb-[18px] w-full box-border rounded-xl border border-white/10 bg-inputbg px-4 py-[14px] text-sm text-primary outline-none placeholder:text-[#5a5a55]"
                value={gPassword}
                onChange={(e) => setGPassword(e.target.value)}
                placeholder="Password"
                type="password"
              />

              {convertError && <div className="mb-3 text-[12.5px] text-error">{convertError}</div>}

              <div className="mb-2.5">
                <GoldButton disabled={converting || !gPhone.trim() || !gPassword.trim()} onClick={convertGuestAccount}>
                  {converting ? "Saving…" : "Save My Appointment & Start Earning"}
                </GoldButton>
              </div>
              <GhostButton onClick={() => router.push("/customer/bookings")}>Skip for now</GhostButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}
