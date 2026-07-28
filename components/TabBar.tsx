"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

const CUSTOMER_TABS = [
  {
    href: "/customer/home",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/customer/book",
    label: "Book",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/customer/bookings",
    label: "Bookings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/customer/rewards",
    label: "Rewards",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2l2.6 6.5L21 9l-5 4.6L17.5 21 12 17.3 6.5 21 8 13.6 3 9l6.4-.5L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const BARBER_TABS = [
  {
    href: "/barber/requests",
    label: "Requests",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M4 4h16v12H8l-4 4V4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/barber/schedule",
    label: "Schedule",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/barber/profile",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="2" />
        <path d="M5 20c1.5-4 4.5-6 7-6s5.5 2 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const OWNER_TABS = [
  {
    href: "/owner/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <rect x="13" y="3" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <rect x="13" y="11" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="15" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: "/owner/crew",
    label: "Crew",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M2.5 20c1.2-3.5 3.7-5.5 6.5-5.5s5.3 2 6.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="17.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M15.5 14.3c2.3.4 4 1.9 5 4.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function TabBar({ role, badge }: { role: "customer" | "barber" | "owner"; badge?: boolean }) {
  const pathname = usePathname();
  const tabs = role === "customer" ? CUSTOMER_TABS : role === "barber" ? BARBER_TABS : OWNER_TABS;
  return (
    <div className="flex shrink-0 border-t border-white/[0.08] bg-[#0d0d0d] px-2.5 pb-1 pt-2">
      {tabs.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="relative flex-1 py-1.5 text-center"
            style={{ color: active ? "#D4AF37" : "#6b6b66" }}
          >
            <div className="flex justify-center">
              <Icon>{t.icon}</Icon>
            </div>
            <div className="mt-1 text-[10px] font-bold">{t.label}</div>
            {badge && (t.label === "Requests" || t.label === "Crew") && (
              <div className="absolute right-[calc(50%-22px)] top-0.5 h-2 w-2 rounded-full bg-gold" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
