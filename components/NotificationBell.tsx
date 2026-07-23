"use client";

import { useState } from "react";
import type { Notification } from "@/lib/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function NotificationBell({
  notifications,
  onMarkRead,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <>
      <div
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-card"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke="#f5f5f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 20a2 2 0 004 0" stroke="#f5f5f0" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <div className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] animate-dotPing items-center justify-center rounded-lg bg-gold px-1 text-[9.5px] font-extrabold text-bg">
            {unread}
          </div>
        )}
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-[80] bg-black/55" />
          <div className="absolute left-4 right-4 top-[52px] z-[90] max-h-[70%] animate-slideDown overflow-auto rounded-2xl border border-gold/25 bg-card p-3.5 shadow-2xl">
            <div className="mb-2.5 font-headline text-sm">NOTIFICATIONS</div>
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-faint">No notifications yet.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onMarkRead(n.id)}
                    className="flex cursor-pointer gap-2.5 rounded-xl border border-white/[0.06] p-[11px]"
                    style={{ background: n.read ? "transparent" : "rgba(212,175,55,0.06)" }}
                  >
                    <div className="shrink-0 text-base">{n.icon}</div>
                    <div className="flex-1">
                      <div className="text-[12.5px] font-bold" style={{ color: n.read ? "#a3a39c" : "#f5f5f0" }}>
                        {n.text}
                      </div>
                      <div className="mt-0.5 text-[10.5px] text-faint">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
