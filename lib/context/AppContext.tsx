"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead } from "@/lib/api";
import { initialsFor } from "@/lib/slots";
import type { Notification, Profile } from "@/lib/types";

interface AppContextValue {
  profile: Profile | null;
  isAnonymous: boolean;
  isGuest: boolean; // true when browsing with no upgraded account yet (no profile, or an unconverted anonymous one)
  notifications: Notification[];
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  logout: () => Promise<void>;
  ensureGuestProfile: () => Promise<Profile>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Customer routes are browsable with no session at all — only barbers
  // require a real login. Booking is the only action that needs an identity,
  // and that identity is created lazily via ensureGuestProfile() below.
  const refreshProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setIsAnonymous(false);
      return;
    }
    setIsAnonymous(!!user.is_anonymous);
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile((data as Profile) ?? null);
  }, [supabase]);

  const refreshNotifications = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      await refreshProfile();
      await refreshNotifications();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markRead = useCallback(
    async (id: string) => {
      await markNotificationRead(supabase, id);
      setNotifications((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n)));
    },
    [supabase]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  }, [supabase, router]);

  // Creates an anonymous Supabase session + a minimal "Guest" profile the
  // moment someone who was just browsing actually submits a booking.
  // Anonymous sessions carry a real auth.uid(), so every RLS policy that
  // targets `to authenticated` (bookings, rewards, notifications) already
  // applies to them with no extra rules.
  const ensureGuestProfile = useCallback(async (): Promise<Profile> => {
    if (profile) return profile;

    const {
      data: { user: existing },
    } = await supabase.auth.getUser();

    let userId = existing?.id;
    if (!userId) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      userId = data.user?.id;
    }
    if (!userId) throw new Error("Couldn't start a guest session.");

    const { data: existingProfile } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (existingProfile) {
      setProfile(existingProfile as Profile);
      setIsAnonymous(true);
      return existingProfile as Profile;
    }

    const guestProfile = {
      id: userId,
      role: "customer" as const,
      name: "Guest",
      initials: initialsFor("Guest"),
    };
    const { error: insertErr } = await supabase.from("profiles").insert(guestProfile);
    if (insertErr) throw insertErr;
    await supabase.from("rewards").insert({ user_id: userId, points: 0 });

    const full = { ...guestProfile, email: null, phone: null, location: null, bio: null, rating: 5, cuts_done: 0, created_at: new Date().toISOString() } as Profile;
    setProfile(full);
    setIsAnonymous(true);
    return full;
  }, [profile, supabase]);

  const isGuest = profile === null || isAnonymous;

  return (
    <AppContext.Provider
      value={{ profile, isAnonymous, isGuest, notifications, loading, refreshNotifications, refreshProfile, markRead, logout, ensureGuestProfile }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
