"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
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
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line/10 bg-card"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" stroke="rgb(var(--color-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 20a2 2 0 004 0" stroke="rgb(var(--color-primary))" strokeWidth="2" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <div className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] animate-dotPing items-center justify-center rounded-lg bg-goldsolid px-1 text-[9.5px] font-extrabold text-bg">
            {unread}
          </div>
        )}
      </div>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[200] flex flex-col bg-bg">
            <div className="flex shrink-0 items-center justify-between border-b border-line/[0.07] px-5 py-4">
              <div className="font-headline text-base tracking-wide">NOTIFICATIONS</div>
              <div
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-line/10 text-lg text-primary"
              >
                ✕
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
              {notifications.length === 0 ? (
                <div className="py-16 text-center text-xs text-faint">No notifications yet.</div>
              ) : (
                <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkRead(n.id)}
                      className="flex cursor-pointer gap-3 rounded-2xl border border-line/[0.07] p-4"
                      style={{ background: n.read ? "transparent" : "rgb(var(--color-gold) / 0.08)" }}
                    >
                      <div className="shrink-0 text-xl">{n.icon}</div>
                      <div className="flex-1">
                        <div
                          className="text-[14px] font-bold leading-snug"
                          style={{ color: n.read ? "rgb(var(--color-secondary))" : "rgb(var(--color-primary))" }}
                        >
                          {n.text}
                        </div>
                        <div className="mt-1 text-[11.5px] text-faint">{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
