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
