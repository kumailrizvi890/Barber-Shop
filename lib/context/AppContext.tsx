"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead } from "@/lib/api";
import type { Notification, Profile } from "@/lib/types";

interface AppContextValue {
  profile: Profile | null;
  notifications: Notification[];
  loading: boolean;
  refreshNotifications: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(data as Profile);
  }, [supabase, router]);

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

  return (
    <AppContext.Provider value={{ profile, notifications, loading, refreshNotifications, refreshProfile, markRead, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
