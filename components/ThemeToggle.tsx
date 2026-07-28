"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "fk-theme";

export function ThemeToggle() {
  // Starts in sync with whatever the no-flash bootstrap script in the root
  // layout already applied to <html data-theme>, so there's no mismatch
  // between server-rendered markup and the client's first render.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "light") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.dataset.theme = "dark";
    }
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="fixed right-2.5 top-2.5 z-[300] flex h-9 w-9 items-center justify-center rounded-full border border-line/10 bg-card text-gold shadow-lg transition-transform hover:scale-105"
    >
      {theme === "light" ? (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 12.6A9 9 0 1111.4 3a7 7 0 009.6 9.6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
