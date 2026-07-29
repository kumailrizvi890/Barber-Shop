"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initialsFor } from "@/lib/slots";
import { toE164 } from "@/lib/phone";
import { Wordmark } from "@/components/Logo";
import { Marquee } from "@/components/Marquee";
import { GoldButton } from "@/components/UI";
import { LiveBookingCounter } from "@/components/LiveBookingCounter";
import { Reveal } from "@/components/Reveal";

type DraftService = { id: number; name: string; price: number };

// No fixed street address yet (pre-launch) — a name+city search still drops
// a correct pin and offers directions. Swap for a `daddr=<street address>`
// query once the shop has a confirmed location.
const MAPS_QUERY = "Fade Kings Barber Shop, Lynnwood, WA";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAPS_QUERY)}`;

const TICKER_ITEMS = ["FADES", "TAPERS", "BEARD SCULPT", "KIDS CUTS", "HOT TOWEL SHAVES", "DESIGNS"];

const FEATURES = [
  {
    title: "Book in seconds",
    sub: "Live chair availability, no calls",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="rgb(var(--color-gold))" strokeWidth="2" />
        <path d="M3 10h18M8 3v4M16 3v4" stroke="rgb(var(--color-gold))" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Real barbers, real reviews",
    sub: "Pick your chair by rating & style",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.6 6.5L21 9l-5 4.6L17.5 21 12 17.3 6.5 21 8 13.6 3 9l6.4-.5L12 2z" stroke="rgb(var(--color-gold))" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Earn rewards every visit",
    sub: "Points on every cut, free cuts on us",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="rgb(var(--color-gold))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function AuthCard() {
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
  const isBarberRole = role === "barber";

  const cannotContinue =
    loading ||
    (isBarberRole ? !email.trim() : !phone.trim()) ||
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

  function bookNow() {
    router.push("/customer/home");
  }

  async function continueAuth() {
    if (cannotContinue) return;
    if (isSignup && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const e164Phone = isBarberRole ? null : toE164(phone);

      if (isSignup) {
        const { data, error: signUpErr } = isBarberRole
          ? await supabase.auth.signUp({ email, password })
          : await supabase.auth.signUp({ phone: e164Phone!, password });
        if (signUpErr) throw signUpErr;
        const userId = data.user?.id;
        if (!userId) throw new Error("Something went wrong creating your account.");

        const { error: profileErr } = await supabase.from("profiles").insert({
          id: userId,
          role,
          name: name.trim(),
          email: isBarberRole ? email.trim() : null,
          phone: isBarberRole ? phone.trim() : e164Phone,
          location: role === "barber" ? location.trim() : null,
          bio: role === "barber" ? bio.trim() : null,
          initials: initialsFor(name.trim()),
          // Barber signups need owner approval before they're bookable; everyone else is live immediately.
          status: role === "barber" ? "pending" : "approved",
        });
        if (profileErr) throw profileErr;

        if (role === "barber" && services.length > 0) {
          const { error: svcErr } = await supabase.from("barber_services").insert(
            services.map((s) => ({ barber_id: userId, name: s.name, price: s.price }))
          );
          if (svcErr) throw svcErr;
        }
        await supabase.from("rewards").insert({ user_id: userId, points: 0 });

        router.push(role === "barber" ? "/pending" : "/customer/home");
      } else {
        const { data, error: signInErr } = isBarberRole
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signInWithPassword({ phone: e164Phone!, password });
        if (signInErr) throw signInErr;
        const userId = data.user?.id;
        const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", userId).single();
        if (profile?.role === "owner") router.push("/owner/dashboard");
        else if (profile?.role === "barber") router.push(profile.status === "approved" ? "/barber/requests" : "/pending");
        else router.push("/customer/home");
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mb-3 w-full box-border rounded-xl border border-line/10 bg-inputbg px-4 py-[14px] text-sm text-primary outline-none placeholder:text-faint";

  return (
    <div className="w-full rounded-[24px] border border-gold/20 bg-cardalt/90 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
      <button
        onClick={bookNow}
        className="mb-4 flex w-full animate-pulseGold items-center justify-center gap-2 rounded-xl bg-goldsolid py-[18px] text-[16px] font-extrabold text-bg transition-transform hover:scale-[1.015]"
      >
        Book Now <span aria-hidden>→</span>
      </button>
      <div className="mb-4 flex items-center gap-3 text-[10.5px] font-bold tracking-wide text-faint">
        <div className="h-px flex-1 bg-line/[0.08]" />
        OR LOG IN / SIGN UP
        <div className="h-px flex-1 bg-line/[0.08]" />
      </div>

      <div className="mb-4 flex rounded-xl border border-line/[0.07] bg-inputbg p-1">
        <button
          onClick={() => setMode("login")}
          className="flex-1 rounded-[9px] py-[10px] text-[12.5px] font-extrabold"
          style={{
            background: mode === "login" ? "rgb(var(--color-goldsolid))" : "transparent",
            color: mode === "login" ? "rgb(var(--color-bg))" : "rgb(var(--color-muted))",
          }}
        >
          Log In
        </button>
        <button
          onClick={() => setMode("signup")}
          className="flex-1 rounded-[9px] py-[10px] text-[12.5px] font-extrabold"
          style={{
            background: mode === "signup" ? "rgb(var(--color-goldsolid))" : "transparent",
            color: mode === "signup" ? "rgb(var(--color-bg))" : "rgb(var(--color-muted))",
          }}
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
              background: role === r ? "rgb(var(--color-gold) / 0.12)" : "transparent",
              border: `1px solid ${role === r ? "rgb(var(--color-gold) / 0.5)" : "rgb(var(--color-line) / 0.1)"}`,
              color: role === r ? "rgb(var(--color-gold))" : "rgb(var(--color-secondary))",
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
              <div key={s.id} className="flex items-center gap-2 rounded-[10px] border border-line/[0.08] bg-inputbg px-3 py-2.5">
                <div className="flex-1 text-[13px] font-bold">{s.name}</div>
                <div className="text-[13px] font-bold text-gold">${s.price}</div>
                <div onClick={() => removeService(s.id)} className="cursor-pointer px-0.5 text-[13px] text-muted">✕</div>
              </div>
            ))}
          </div>
          <div className="mb-4 flex gap-2">
            <input
              className="min-w-0 flex-[1.4] box-border rounded-[10px] border border-line/10 bg-inputbg px-3 py-[11px] text-[13px] outline-none"
              value={svcName}
              onChange={(e) => setSvcName(e.target.value)}
              placeholder="Service (e.g. Skin Fade)"
            />
            <input
              className="w-14 box-border rounded-[10px] border border-line/10 bg-inputbg px-2 py-[11px] text-[13px] outline-none"
              value={svcPrice}
              onChange={(e) => setSvcPrice(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="$"
            />
            <div onClick={addService} className="flex w-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-goldsolid text-lg font-extrabold text-bg">+</div>
          </div>
        </>
      )}

      {isBarberRole ? (
        <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" />
      ) : (
        <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" type="tel" />
      )}
      <input className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <div className="mb-[18px] text-[11px] text-faint">{isSignup ? "At least 8 characters" : " "}</div>

      {error && <div className="mb-3 text-[12.5px] text-error">{error}</div>}

      <GoldButton disabled={cannotContinue} onClick={continueAuth}>
        {loading ? "Please wait…" : isSignup ? "Create Account" : "Log In"}
      </GoldButton>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg">
      {/*
        Hero photo + the "the shop" shot below are free-licensed Unsplash
        stock (self-hosted in /public/images) — placeholders until real
        shop/barber photography is swapped in. See PROJECT-HANDOFF.md.
      */}
      <section className="relative flex h-[92vh] min-h-[600px] w-full flex-col overflow-hidden bg-black">
        <Image
          src="/images/hero-cut.jpg"
          alt="A Fade Kings barber detailing a fresh cut with shears"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_22%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/35 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-transparent to-transparent" />

        <header className="relative z-10 mx-auto flex w-full max-w-[1280px] animate-fadeInUp items-center justify-between px-6 pt-8 sm:px-10">
          <div className="text-white">
            <Wordmark size={20} />
          </div>
          <a href="tel:+14253611190" className="flex items-center gap-2 text-[13px] font-bold text-white/85 transition-colors hover:text-gold">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            (425) 361-1190
          </a>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-end px-6 pb-14 sm:px-10">
          <div
            className="mb-4 inline-flex w-fit animate-fadeInUp items-center gap-2 rounded-full border border-gold/40 bg-black/30 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-gold backdrop-blur-sm"
            style={{ animationDelay: "80ms" }}
          >
            LYNNWOOD, WA — WALK-INS &amp; BOOKINGS
          </div>
          <h1
            className="max-w-[780px] animate-fadeInUp font-headline text-[46px] leading-[0.98] tracking-tight text-white sm:text-[64px] lg:text-[84px]"
            style={{ animationDelay: "160ms" }}
          >
            FRESH FADES.
            <br />
            <span className="text-gold">FAST BOOKS.</span>
          </h1>
          <p
            className="mt-5 max-w-[440px] animate-fadeInUp text-[15px] leading-[1.6] text-white/75 sm:text-base"
            style={{ animationDelay: "260ms" }}
          >
            Fade Kings Barber Shop — Lynnwood's chair, on your schedule. Browse the crew and prices, or lock in a slot in under a minute. No account required to look around.
          </p>
          <a
            href="#book"
            className="mt-7 inline-flex w-fit animate-fadeInUp items-center gap-2 rounded-md bg-goldsolid px-8 py-4 text-[14px] font-extrabold tracking-wide text-bg transition-transform hover:scale-[1.02]"
            style={{ animationDelay: "340ms" }}
          >
            BOOK NOW <span aria-hidden>→</span>
          </a>
        </div>
      </section>

      <div className="relative">
        <div className="grid-texture pointer-events-none absolute inset-0" />

        <main
          id="book"
          className="relative z-10 mx-auto grid max-w-[1280px] scroll-mt-6 grid-cols-1 gap-14 px-6 pb-16 pt-0 sm:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10 lg:pb-20"
        >
          <div className="relative min-w-0">
            {/* Pulled up over the hero photo's bottom edge with a negative
                margin so the two sections visually overlap instead of
                meeting at a hard seam. */}
            <div className="-mt-10 overflow-hidden rounded-2xl border-y border-gold/20 bg-gold/[0.08] py-3 shadow-xl backdrop-blur-sm sm:-mt-14">
              <Marquee items={TICKER_ITEMS} />
            </div>

            <Reveal className="mt-10">
              <div className="mb-4 font-headline text-sm tracking-wide">WHY FADE KINGS</div>
              <div className="flex flex-col divide-y divide-line/[0.06] rounded-2xl bg-card shadow-sm">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="flex items-center gap-3 px-4 py-4 transition-colors duration-300 hover:bg-gold/[0.05]"
                  >
                    <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] bg-gold/[0.12]">{f.icon}</div>
                    <div>
                      <div className="text-[13px] font-bold">{f.title}</div>
                      <div className="text-[11.5px] text-muted">{f.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120} className="group relative mt-10 h-[260px] overflow-hidden rounded-2xl border border-line/[0.07] sm:h-[320px]">
              <Image
                src="/images/hero-chairs.jpg"
                alt="Fade Kings barber chairs"
                fill
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
            </Reveal>
          </div>

          <div className="lg:sticky lg:top-16">
            <AuthCard />
            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mt-4 block h-[150px] overflow-hidden rounded-2xl border border-line/[0.07] transition-colors hover:border-gold/25"
            >
              <iframe
                src={`https://www.google.com/maps?q=${encodeURIComponent(MAPS_QUERY)}&output=embed`}
                className="pointer-events-none h-full w-full grayscale-[0.3] brightness-[0.85] contrast-[1.1]"
                loading="lazy"
                title="Fade Kings Barber Shop location"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/90 to-transparent px-4 pb-3 pt-8">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-white">Fade Kings Barber Shop</div>
                  <div className="mt-0.5 text-[11px] text-white/70">Lynnwood, WA — tap for directions</div>
                </div>
                <div className="shrink-0 text-gold">→</div>
              </div>
            </a>
          </div>
        </main>

        <Reveal className="relative z-10 mx-auto max-w-[1280px] px-6 pb-16 sm:px-10">
          <div className="grid grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-4">
            {[
              { big: "4.6★", small: "Avg Rating" },
              { big: "10K+", small: "Cuts Done" },
              { big: "Local", small: "Est. Lynnwood" },
            ].map((s) => (
              <div key={s.small} className="rounded-[14px] border border-line/[0.07] bg-card px-2 py-4 text-center">
                <div className="font-headline text-[20px] text-gold">{s.big}</div>
                <div className="mt-1 text-[10px] text-muted">{s.small}</div>
              </div>
            ))}
            <LiveBookingCounter />
          </div>
        </Reveal>

        <footer className="relative z-10 border-t border-line/[0.06] py-6 text-center text-[10.5px] text-faint">
          FADE KINGS BARBER SHOP — LYNNWOOD, WA · (425) 361-1190 © 2026
        </footer>
      </div>

      <a
        href="#book"
        className="fixed bottom-4 right-4 z-[140] flex items-center gap-2 rounded-md bg-primary px-5 py-3.5 text-[12.5px] font-extrabold tracking-wide text-bg shadow-2xl transition-transform hover:scale-[1.03] sm:bottom-6 sm:right-6 sm:px-6 sm:py-4 sm:text-[13px]"
      >
        BOOK NOW <span aria-hidden>→</span>
      </a>
    </div>
  );
}
