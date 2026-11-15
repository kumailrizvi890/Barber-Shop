import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Placeholder fallback when the env vars are missing (see
// lib/supabase/client.ts): session refresh then fails softly instead of
// throwing on every request.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

    await supabase.auth.getUser();
    return response;
  } catch {
    // Supabase unreachable (paused project, no env vars, no network):
    // let the request through. Public pages run on bundled sample data
    // and signed-in-only routes handle the missing session themselves.
    return response;
  }
}
