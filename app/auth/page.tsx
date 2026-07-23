"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initialsFor } from "@/lib/slots";
import { Wordmark, BarberPole } from "@/components/BarberPole";
import { GoldButton } from "@/components/UI";

type DraftService = { id: number; name: string; price: number };

const TICKER_ITEMS = ["FADES", "TAPERS", "BEARD SCULPT", "KIDS CUTS", "HOT TOWEL SHAVES", "DESIGNS"];

const FEATURES = [
  {
    title: "Book in seconds",
    sub: "Live chair availability, no calls",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="#D4AF37" strokeWidth="2" />
        <path d="M3 10h18M8 3v4M16 3v4" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Real barbers, real reviews",
    sub: "Pick your chair by rating & style",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.6 6.5L21 9l-5 4.6L17.5 21 12 17.3 6.5 21 8 13.6 3 9l6.4-.5L12 2z" stroke="#D4AF37" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Earn rewards every visit",
    sub: "Points on every cut, free cuts on us",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<"customer" | "barber">("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [services, setServices] = useState<DraftService[]>([]);
  const [svcName, setSvcName] = useState("");
  const [svcPrice, setSvcPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";
  const isBarberSignup = isSignup && role === "barber";

  const cannotContinue =
    loading ||
    !email.trim() ||
    !password.trim() ||
    (isSignup && !name.trim()) ||
    (isBarberSignup && (!location.trim() || services.length === 0));

  function addService() {
    const price = parseFloat(svcPrice);
    if (!svcName.trim() || !price) return;
    setServices((s) => [...s, { id: Date.now(), name: svcName.trim(), price }]);
    setSvcName("");
    setSvcPrice("");
  }
  function removeService(id: number) {
    setServices((s) => s.filter((d) => d.id !== id));
  }

  async function continueAuth() {
    if (cannotContinue) return;
    setLoading(true);
    setError(null);
    try {
      if (isSignup) {
        const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) throw signUpErr;
        const userId = data.user?.id;
        if (!userId) throw new Error("Check your inbox to confirm your email, then log in.");

        const { error: profileErr } = await supabase.from("profiles").insert({
          id: userId,
          role,
          name: name.trim(),
          email,
          phone: role === "barber" ? phone.trim() : null,
          location: role === "barber" ? location.trim() : null,
          bio: role === "barber" ? bio.trim() : null,
          initials: initialsFor(name.trim()),
        });
        if (profileErr) throw profileErr;

        if (role === "barber" && services.length > 0) {
          const { error: svcErr } = await supabase.from("barber_services").insert(
            services.map((s) => ({ barber_id: userId, name: s.name, price: s.price }))
          );
          if (svcErr) throw svcErr;
        }
        await supabase.from("rewards").insert({ user_id: userId, points: 0 });

        router.push(role === "barber" ? "/barber/requests" : "/customer/home");
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (signInErr) throw signInErr;
        const userId = data.user?.id;
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
        router.push(profile?.role === "barber" ? "/barber/requests" : "/customer/home");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mb-3 w-full box-border rounded-xl border border-white/10 bg-inputbg px-4 py-[14px] text-sm text-primary outline-none placeholder:text-[#5a5a55]";

  return (
    <div className="app-shell">
      <div className="h-full overflow-auto">
        <div className="px-6 pb-[30px] pt-14">
          <div className="mb-[22px]">
            <Wordmark size={20} />
          </div>

          <div className="rounded-[20px] border border-gold/20 bg-cardalt p-5 shadow-2xl">
            <div className="mb-4 flex rounded-xl border border-white/[0.07] bg-inputbg p-1">
              <button
                onClick={() => setMode("login")}
                className="flex-1 rounded-[9px] py-[10px] text-[12.5px] font-extrabold"
                style={{ background: mode === "login" ? "#D4AF37" : "transparent", color: mode === "login" ? "#0a0a0a" : "#8f8f89" }}
              >
                Log In
              </button>
              <button
                onClick={() => setMode("signup")}
                className="flex-1 rounded-[9px] py-[10px] text-[12.5px] font-extrabold"
                style={{ background: mode === "signup" ? "#D4AF37" : "transparent", color: mode === "signup" ? "#0a0a0a" : "#8f8f89" }}
              >
                Sign Up
              </button>
            </div>

            <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">I AM A</div>
            <div className="mb-4 flex gap-2.5">
              {(["customer", "barber"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className="flex-1 rounded-xl py-[13px] text-[13px] font-extrabold capitalize"
                  style={{
                    background: role === r ? "rgba(212,175,55,0.12)" : "transparent",
                    border: `1px solid ${role === r ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.1)"}`,
                    color: role === r ? "#D4AF37" : "#a3a39c",
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {isSignup && (
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder={role === "barber" ? "Full name" : "Your name"} />
            )}

            {isBarberSignup && (
              <>
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
                <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Shop location / address" />
                <textarea
                  className={inputClass + " mb-[14px]"}
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Short bio — your style, experience..."
                />

                <div className="mb-2 text-[11.5px] font-bold tracking-wide text-muted">SERVICES & RATES</div>
                <div className="mb-2.5 flex flex-col gap-1.5">
                  {services.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 rounded-[10px] border border-white/[0.08] bg-inputbg px-3 py-2.5">
                      <div className="flex-1 text-[13px] font-bold">{s.name}</div>
                      <div className="text-[13px] font-bold text-gold">${s.price}</div>
                      <div onClick={() => removeService(s.id)} className="cursor-pointer px-0.5 text-[13px] text-muted">✕</div>
                    </div>
                  ))}
                </div>
                <div className="mb-4 flex gap-2">
                  <input
                    className="min-w-0 flex-[1.4] box-border rounded-[10px] border border-white/10 bg-inputbg px-3 py-[11px] text-[13px] outline-none"
                    value={svcName}
                    onChange={(e) => setSvcName(e.target.value)}
                    placeholder="Service (e.g. Skin Fade)"
                  />
                  <input
                    className="w-14 box-border rounded-[10px] border border-white/10 bg-inputbg px-2 py-[11px] text-[13px] outline-none"
                    value={svcPrice}
                    onChange={(e) => setSvcPrice(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="$"
                  />
                  <div onClick={addService} className="flex w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-gold text-lg font-extrabold text-bg">+</div>
                </div>
              </>
            )}

            <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
            <input className={inputClass + " mb-[18px]"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />

            {error && <div className="mb-3 text-[12.5px] text-error">{error}</div>}

            <GoldButton disabled={cannotContinue} onClick={continueAuth}>
              {loading ? "Please wait…" : isSignup ? "Create Account" : "Log In"}
            </GoldButton>
          </div>
        </div>

        <div className="relative overflow-hidden px-0 pb-[30px] pt-2">
          <div className="pointer-events-none absolute -right-10 top-5 h-[320px] w-[120px] rotate-[18deg] overflow-hidden rounded-[60px] opacity-[0.14]">
            <BarberPole width={120} height={320} radius={60} />
          </div>

          <div className="relative px-6">
            <div className="font-headline text-[34px] leading-[1.02] tracking-tight">
              FRESH
              <br />
              FADES.
              <br />
              <span className="text-gold">FAST BOOKS.</span>
            </div>
            <div className="mt-3 max-w-[260px] text-[12.5px] leading-[1.5] text-secondary">
              Real chairs, real barbers, real-time availability — book your slot and roll up ready.
            </div>
          </div>

          <div className="mt-[22px] overflow-hidden border-y border-gold/20 bg-gold/5 py-2.5">
            <div className="marquee-track animate-marquee">
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
                <div key={i} className="whitespace-nowrap px-[18px] font-headline text-[13px] tracking-wide text-gold">
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2.5 px-6 pt-[22px]">
            {[
              { big: "4.9★", small: "Avg Rating" },
              { big: "12K+", small: "Cuts Done" },
              { big: "40+", small: "Barbers" },
            ].map((s) => (
              <div key={s.small} className="flex-1 rounded-[14px] border border-white/[0.07] bg-card px-1.5 py-3.5 text-center">
                <div className="font-headline text-[19px] text-gold">{s.big}</div>
                <div className="mt-1 text-[10px] text-muted">{s.small}</div>
              </div>
            ))}
          </div>

          <div className="px-6 pt-[26px]">
            <div className="mb-3.5 font-headline text-sm tracking-wide">WHY FADE HOUSE</div>
            <div className="flex flex-col gap-2.5">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-center gap-3 rounded-[14px] border border-white/[0.07] bg-card px-3.5 py-[13px]">
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-gold/[0.12]">{f.icon}</div>
                  <div>
                    <div className="text-[13px] font-bold">{f.title}</div>
                    <div className="text-[11.5px] text-muted">{f.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-[26px] text-center text-[10.5px] text-[#5a5a55]">FADE HOUSE © 2026</div>
        </div>
      </div>
    </div>
  );
}
