import type { SupabaseClient } from "@supabase/supabase-js";
import type { BarberService, Profile } from "@/lib/types";
import { demoBarbers } from "@/lib/demo-data";
import { withTimeout } from "@/lib/with-timeout";

// Live reads get 2.5s before the demo falls back to sample data, so a
// hung backend never leaves the menu and crew blank for long.
const LIVE_TIMEOUT_MS = 2500;

export interface BarberWithServices extends Profile {
  barber_services: BarberService[];
}

export async function fetchBarbers(supabase: SupabaseClient | null): Promise<BarberWithServices[]> {
  // Live data first. If Supabase cannot be reached at all (the project is
  // paused, the network is down), fall back to the bundled sample crew so
  // the public menu and crew sections still render instead of erroring.
  if (!supabase) return demoBarbers();
  try {
    const res = await withTimeout(
      supabase
        .from("profiles")
        .select("*, barber_services(*)")
        .eq("role", "barber")
        .eq("status", "approved")
        .order("name"),
      LIVE_TIMEOUT_MS
    );
    if (!res) return demoBarbers();
    if (res.error) throw res.error;
    return (res.data as BarberWithServices[]) ?? [];
  } catch {
    return demoBarbers();
  }
}

export function specialtyLabel(b: BarberWithServices) {
  return b.barber_services[0]?.name ?? "General cuts";
}

export function priceLabel(b: BarberWithServices) {
  if (b.barber_services.length === 0) return "";
  const min = Math.min(...b.barber_services.map((s) => s.price));
  return `From $${min}`;
}

// One row of the shop's services menu: every distinct service the approved
// barbers offer, priced from the cheapest barber who does it. Kept here so
// the landing page and the customer home show the same prices from the same
// real data instead of each building its own list. Services carry a name
// and a price only — there is no duration in the data, so none is shown.
export interface ShopService {
  id: string;
  name: string;
  price: number;
  barberIds: string[];
}

export function shopServices(barbers: BarberWithServices[]): ShopService[] {
  const byName = new Map<string, ShopService>();
  for (const barber of barbers) {
    for (const service of barber.barber_services) {
      const existing = byName.get(service.name);
      if (!existing) {
        byName.set(service.name, {
          id: service.id,
          name: service.name,
          price: service.price,
          barberIds: [barber.id],
        });
      } else {
        if (!existing.barberIds.includes(barber.id)) existing.barberIds.push(barber.id);
        if (service.price < existing.price) {
          existing.id = service.id;
          existing.price = service.price;
        }
      }
    }
  }
  return [...byName.values()].sort((a, b) => a.price - b.price);
}
