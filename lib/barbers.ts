import type { SupabaseClient } from "@supabase/supabase-js";
import type { BarberService, Profile } from "@/lib/types";

export interface BarberWithServices extends Profile {
  barber_services: BarberService[];
}

export async function fetchBarbers(supabase: SupabaseClient): Promise<BarberWithServices[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*, barber_services(*)")
    .eq("role", "barber")
    .eq("status", "approved")
    .order("name");
  if (error) throw error;
  return (data as BarberWithServices[]) ?? [];
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
// real data instead of each building its own list.
export interface ShopService {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
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
          duration_minutes: service.duration_minutes,
          barberIds: [barber.id],
        });
      } else {
        if (!existing.barberIds.includes(barber.id)) existing.barberIds.push(barber.id);
        if (service.price < existing.price) {
          existing.id = service.id;
          existing.price = service.price;
          existing.duration_minutes = service.duration_minutes;
        }
      }
    }
  }
  return [...byName.values()].sort((a, b) => a.price - b.price);
}
