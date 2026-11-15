// Sample shop data for the public demo.
//
// The live Fade Kings Supabase project is paused, so the shop's real crew
// and prices cannot be fetched. These bundled samples keep the public demo
// working with no backend: services, crew, and the booking flow all render
// and can be walked through. Nothing here is a real person: the names and
// prices are generic sample content. When the live project is back, the
// real data wins automatically (see fetchBarbers in lib/barbers.ts) and
// this file is only a fallback. Replace the sample crew with the real crew
// at that point if the shop wants no sample names on the live site.

import type { BarberService, Profile } from "@/lib/types";
import type { BarberWithServices } from "@/lib/barbers";
import type { BarberProfileData } from "@/lib/api";

function sampleBarber(
  id: string,
  name: string,
  initials: string,
  rating: number,
  cutsDone: number,
  bio: string,
  services: { name: string; price: number }[]
): BarberWithServices {
  return {
    id,
    role: "barber",
    name,
    email: null,
    phone: null,
    location: "Lynnwood, WA",
    bio,
    initials,
    rating,
    cuts_done: cutsDone,
    status: "approved",
    created_at: "2026-01-01T00:00:00.000Z",
    barber_services: services.map((s, i) => ({
      id: `demo-service-${id}-${i}`,
      barber_id: id,
      name: s.name,
      price: s.price,
      created_at: "2026-01-01T00:00:00.000Z",
    })) as BarberService[],
  } as BarberWithServices;
}

export const DEMO_BARBERS: BarberWithServices[] = [
  sampleBarber("demo-barber-marcus", "Marcus Bennett", "MB", 4.9, 1240, "Skin fades and sharp line ups. Ten years behind the chair.", [
    { name: "Skin Fade", price: 35 },
    { name: "Classic Cut", price: 30 },
    { name: "Beard Trim", price: 15 },
    { name: "Line Up", price: 15 },
  ]),
  sampleBarber("demo-barber-jay", "Jay Carter", "JC", 4.8, 980, "Classic cuts, beard sculpting, and hot towel shaves.", [
    { name: "Classic Cut", price: 30 },
    { name: "Hot Towel Shave", price: 25 },
    { name: "Beard Trim", price: 15 },
    { name: "Fade and Beard Combo", price: 45 },
  ]),
  sampleBarber("demo-barber-andre", "Andre Thompson", "AT", 4.7, 760, "Kids cuts, designs, and weekend fresh ups.", [
    { name: "Kids Cut", price: 25 },
    { name: "Skin Fade", price: 35 },
    { name: "Hair Design", price: 20 },
    { name: "Classic Cut", price: 30 },
  ]),
];

// Fresh copy each time so callers never mutate the shared sample list.
export function demoBarbers(): BarberWithServices[] {
  return DEMO_BARBERS.map((b) => ({
    ...b,
    barber_services: b.barber_services.map((s) => ({ ...s })),
  }));
}

export function isDemoBarberId(id: string | null | undefined): boolean {
  return !!id && id.startsWith("demo-barber-");
}

export function isDemoData(barbers: BarberWithServices[]): boolean {
  return barbers.length > 0 && barbers.every((b) => isDemoBarberId(b.id));
}

export function demoBarberProfile(barberId: string): BarberProfileData | null {
  const barber = DEMO_BARBERS.find((b) => b.id === barberId);
  if (!barber) return null;
  const { barber_services, ...profile } = barber;
  return {
    profile: profile as Profile,
    services: barber_services.map((s) => ({ id: s.id, name: s.name, price: s.price })),
    posts: [],
  };
}

// Sample total shown on the landing page counter when the live counter
// cannot be reached. Only a fallback, never mixed with the real count.
export const DEMO_BOOKING_COUNT = 1284;
