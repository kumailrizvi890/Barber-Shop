"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  fetchBarbers,
  shopServices,
  specialtyLabel,
  priceLabel,
  type BarberWithServices,
} from "@/lib/barbers";
import { BarberAvatar } from "@/components/UI";
import { initialsFor, TIME_SLOTS } from "@/lib/slots";

// Services, prices and crew, straight from the shop's real data — the
// approved barbers and the services they set themselves. Nothing here is
// demo content: when no barbers are listed, the sections say so instead of
// showing made-up prices or faces. Tapping a service or a barber jumps
// straight into the booking flow with that choice already picked.
export function ShopSections() {
  const [barbers, setBarbers] = useState<BarberWithServices[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setBarbers(await fetchBarbers(createClient()));
      } catch {
        setFailed(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const services = shopServices(barbers);
  const hours = `${TIME_SLOTS[0]} – ${TIME_SLOTS[TIME_SLOTS.length - 1]}, every day`;

  return (
    <>
      {/* ---------- SERVICES & PRICES ---------- */}
      <section id="services" className="mx-auto w-full max-w-7xl px-5 py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-gold">Services &amp; prices</p>
            <h2 className="mt-2 font-headline text-4xl text-primary md:text-5xl">PRICED TO BE YOUR REGULAR SHOP.</h2>
          </div>
          <Link
            href="/customer/book"
            className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-sm font-extrabold uppercase tracking-wide text-black transition-all hover:brightness-110"
          >
            Book a chair →
          </Link>
        </div>
        {loading ? (
          <p className="mt-8 text-muted">Loading the menu…</p>
        ) : failed ? (
          <p className="mt-8 text-muted">Couldn’t load the menu — try again in a bit.</p>
        ) : services.length === 0 ? (
          <p className="mt-8 max-w-xl text-muted">
            No prices to show yet — the crew sets their own prices, and no barbers are listed right now. Check back soon.
          </p>
        ) : (
          <ul className="mt-8 divide-y divide-line/10 border-y border-line/10">
            {services.map((s) => (
              <li key={s.id}>
                <Link href={`/customer/book?service=${s.id}`} className="group flex items-center justify-between gap-4 py-4">
                  <span>
                    <span className="block font-headline text-lg text-primary group-hover:text-gold md:text-xl">{s.name}</span>
                    <span className="block text-sm text-muted">
                      From ${s.price} · {s.barberIds.length === 1 ? "1 barber" : `${s.barberIds.length} barbers`}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-headline text-2xl text-gold">${s.price}</span>
                    <span className="text-sm font-bold uppercase tracking-wider text-primary group-hover:text-gold">Book →</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-muted">Nothing is charged when you book — pay at the shop.</p>
      </section>

      {/* ---------- MEET THE CREW ---------- */}
      <section className="mx-auto w-full max-w-7xl px-5 pb-16 md:pb-20">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-gold">Meet the crew</p>
        <h2 className="mt-2 font-headline text-4xl text-primary md:text-5xl">REAL BARBERS. REAL REVIEWS.</h2>
        {loading ? (
          <p className="mt-8 text-muted">Loading the crew…</p>
        ) : failed ? (
          <p className="mt-8 text-muted">Couldn’t load the crew — try again in a bit.</p>
        ) : barbers.length === 0 ? (
          <p className="mt-8 max-w-xl text-muted">No barbers listed yet — check back soon.</p>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {barbers.map((b) => (
              <Link
                key={b.id}
                href={`/customer/book?barber=${b.id}`}
                className="group block border border-line/10 bg-card p-5 transition-colors hover:border-gold/50"
              >
                <BarberAvatar initials={initialsFor(b.name)} size={56} />
                <h3 className="mt-4 font-headline text-xl text-primary group-hover:text-gold">{b.name}</h3>
                <p className="text-sm text-muted">{specialtyLabel(b)}</p>
                {priceLabel(b) ? <p className="mt-2 text-sm font-bold text-gold">{priceLabel(b)}</p> : null}
                <span className="mt-4 inline-block text-sm font-bold uppercase tracking-wider text-primary group-hover:text-gold">
                  Book {b.name.split(" ")[0]} →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ---------- VISIT ---------- */}
      <section className="border-y border-line/10 bg-card">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-10 gap-y-3 px-5 py-5 text-sm">
          <span className="font-headline tracking-wide text-gold">VISIT</span>
          <span className="text-primary">Lynnwood, WA</span>
          <a href="tel:+14253611190" className="text-primary hover:text-gold">
            (425) 361-1190
          </a>
          <span className="text-muted">Booking hours {hours}</span>
          <a href="#book" className="font-bold uppercase tracking-wider text-gold hover:brightness-110">
            Book a chair →
          </a>
        </div>
      </section>
    </>
  );
}
