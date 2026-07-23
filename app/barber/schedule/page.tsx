"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/context/AppContext";
import { markCompleted, sendReminder, setAllSlots, toggleBlockedSlot } from "@/lib/api";
import { TIME_SLOTS, WEEKDAYS } from "@/lib/slots";
import { StatusBadge } from "@/components/UI";
import type { Booking } from "@/lib/types";

type View = "bookings" | "availability";

export default function SchedulePage() {
  const supabase = createClient();
  const { profile, refreshNotifications } = useApp();
  const [view, setView] = useState<View>("bookings");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  const [weekday, setWeekday] = useState(0);
  const [blocked, setBlocked] = useState<Set<number>>(new Set());
  const [loadingAvail, setLoadingAvail] = useState(true);

  const loadBookings = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("bookings")
      .select("*, customer:customer_id(name)")
      .eq("barber_id", profile.id)
      .in("status", ["approved", "completed"])
      .order("date", { ascending: true });
    setBookings((data as any) ?? []);
    setLoadingBookings(false);
  }, [profile, supabase]);

  const loadAvailability = useCallback(async () => {
    if (!profile) return;
    setLoadingAvail(true);
    const { data } = await supabase
      .from("availability")
      .select("slot_index, blocked")
      .eq("barber_id", profile.id)
      .eq("weekday", weekday)
      .eq("blocked", true);
    setBlocked(new Set((data ?? []).map((r: any) => r.slot_index)));
    setLoadingAvail(false);
  }, [profile, supabase, weekday]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);
  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  async function remind(b: Booking) {
    await sendReminder(supabase, b);
    await refreshNotifications();
    loadBookings();
  }
  async function complete(b: Booking) {
    await markCompleted(supabase, b);
    await refreshNotifications();
    loadBookings();
  }

  async function toggleSlot(i: number) {
    if (!profile) return;
    const nextBlocked = !blocked.has(i);
    setBlocked((prev) => {
      const next = new Set(prev);
      nextBlocked ? next.add(i) : next.delete(i);
      return next;
    });
    await toggleBlockedSlot(supabase, profile.id, weekday, i, nextBlocked);
  }

  async function openAll() {
    if (!profile) return;
    setBlocked(new Set());
    await setAllSlots(supabase, profile.id, weekday, false, TIME_SLOTS.length);
  }
  async function blockAll() {
    if (!profile) return;
    setBlocked(new Set(TIME_SLOTS.map((_, i) => i)));
    await setAllSlots(supabase, profile.id, weekday, true, TIME_SLOTS.length);
  }

  return (
    <div>
      <div className="mb-1 font-headline text-[19px]">SCHEDULE</div>
      <div className="mb-3.5 text-xs text-muted">Manage bookings & weekly availability</div>

      <div className="mb-[18px] flex rounded-xl border border-white/[0.07] bg-card p-1">
        <button
          onClick={() => setView("bookings")}
          className="flex-1 rounded-[9px] py-[9px] text-xs font-extrabold"
          style={{ background: view === "bookings" ? "#D4AF37" : "transparent", color: view === "bookings" ? "#0a0a0a" : "#8f8f89" }}
        >
          Bookings
        </button>
        <button
          onClick={() => setView("availability")}
          className="flex-1 rounded-[9px] py-[9px] text-xs font-extrabold"
          style={{ background: view === "availability" ? "#D4AF37" : "transparent", color: view === "availability" ? "#0a0a0a" : "#8f8f89" }}
        >
          Availability
        </button>
      </div>

      {view === "bookings" &&
        (loadingBookings ? (
          <div className="py-[60px] text-center text-xs text-faint">Loading…</div>
        ) : bookings.length === 0 ? (
          <div className="py-[60px] text-center text-[13px] text-faint">Nothing on the books.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((a) => (
              <div key={a.id} className="rounded-2xl border border-white/[0.08] bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[15px] font-extrabold">{(a as any).customer?.name}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      {a.service_name} · ${a.price}
                    </div>
                    <div className="mt-2 flex gap-3.5">
                      <div className="text-[12.5px] font-bold text-gold">{a.date}</div>
                      <div className="text-[12.5px] font-bold text-gold">{a.time}</div>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-3.5 flex gap-2.5">
                  <button
                    disabled={a.reminder_sent || a.status !== "approved"}
                    onClick={() => remind(a)}
                    className="flex-1 rounded-[10px] border border-gold/40 py-2.5 text-xs font-bold disabled:opacity-40"
                    style={{ color: "#D4AF37" }}
                  >
                    {a.reminder_sent ? "Reminder Sent" : "Send Reminder"}
                  </button>
                  <button
                    disabled={a.status !== "approved"}
                    onClick={() => complete(a)}
                    className="flex-1 rounded-[10px] py-2.5 text-xs font-extrabold disabled:opacity-40"
                    style={{ background: a.status === "completed" ? "rgba(212,175,55,0.15)" : "#D4AF37", color: a.status === "completed" ? "#D4AF37" : "#0a0a0a" }}
                  >
                    {a.status === "completed" ? "Completed" : "Mark Completed"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

      {view === "availability" && (
        <div>
          <div className="mb-3 text-[11.5px] text-muted">This weekly pattern repeats every week until you change it.</div>
          <div className="mb-4 flex gap-1.5">
            {WEEKDAYS.map((w, i) => {
              const active = i === weekday;
              return (
                <div
                  key={w}
                  onClick={() => setWeekday(i)}
                  className="flex-1 cursor-pointer rounded-[11px] py-2.5 text-center text-[11px] font-extrabold"
                  style={{
                    background: active ? "rgba(212,175,55,0.12)" : "#1c1c1c",
                    border: `1px solid ${active ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: active ? "#D4AF37" : "#a3a39c",
                  }}
                >
                  {w}
                </div>
              );
            })}
          </div>
          <div className="mb-4 flex gap-2.5">
            <button onClick={openAll} className="flex-1 rounded-[10px] border border-gold/40 py-2.5 text-xs font-bold text-gold">
              Open All
            </button>
            <button onClick={blockAll} className="flex-1 rounded-[10px] border border-white/15 py-2.5 text-xs font-bold text-secondary">
              Block All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {TIME_SLOTS.map((label, i) => {
              const isBlocked = blocked.has(i);
              return (
                <div
                  key={label}
                  onClick={() => toggleSlot(i)}
                  className="cursor-pointer rounded-[10px] py-3 text-center text-[13px] font-bold"
                  style={{
                    background: isBlocked ? "#161616" : "rgba(95,206,137,0.12)",
                    color: isBlocked ? "#6b6b66" : "#5fce89",
                    border: `1px solid ${isBlocked ? "rgba(255,255,255,0.08)" : "rgba(95,206,137,0.3)"}`,
                    opacity: loadingAvail ? 0.5 : 1,
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
