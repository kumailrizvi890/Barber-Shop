import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

// When the env vars are missing, fall back to a placeholder URL instead of
// throwing: the app then runs on its bundled sample data and every live
// call fails gracefully instead of crashing the page on first render.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Singleton browser client — avoids "Multiple GoTrueClient instances" warnings
// when several client components each call createClient().
export function createClient() {
  if (!client) {
    client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}
