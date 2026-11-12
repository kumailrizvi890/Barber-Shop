"use client";

import type { CSSProperties, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

// Fade Kings redesign: buttons and cards are sharp — square corners,
// uppercase labels, gold-on-black. (globals.css also flattens the larger
// `rounded-*` radii theme-wide; these classes state the intent here too.)
export function GoldButton({ children, onClick, type = "button", disabled, className = "" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center gap-2 bg-gold text-black font-extrabold uppercase tracking-wide px-6 py-3.5 rounded-none text-[15px] shadow-[0_10px_30px_rgba(198,148,47,0.35)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed " +
        className
      }
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, type = "button", disabled, className = "" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={
        "inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-none border-2 border-line/15 text-[15px] font-extrabold uppercase tracking-wide hover:border-gold/50 hover:text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed " +
        className
      }
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={style} className={"bg-card border border-line/[0.07] rounded-none " + className}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gold mb-2">{children}</div>;
}

export function BarberAvatar({ initials, size = 52, rounded = 0 }: { initials: string; size?: number; rounded?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center font-headline text-gold border border-gold/20"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        fontSize: size * 0.28,
        backgroundImage:
          "repeating-linear-gradient(135deg, rgb(var(--color-surface2)) 0px, rgb(var(--color-surface2)) 6px, rgb(var(--color-card)) 6px, rgb(var(--color-card)) 12px)",
      }}
    >
      {initials}
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgb(var(--color-line) / 0.08)", color: "rgb(var(--color-secondary))", label: "PENDING" },
  approved: { bg: "rgb(var(--color-success) / 0.15)", color: "rgb(var(--color-success))", label: "APPROVED" },
  declined: { bg: "rgb(var(--color-error) / 0.15)", color: "rgb(var(--color-error))", label: "DECLINED" },
  completed: { bg: "rgb(var(--color-goldsolid) / 0.15)", color: "rgb(var(--color-gold))", label: "COMPLETED" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <div className="text-[10.5px] font-extrabold tracking-wide px-[9px] py-1 rounded-none" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </div>
  );
}

export function statusStripeColor(status: string) {
  return (
    {
      pending: "rgb(var(--color-faint))",
      approved: "rgb(var(--color-success))",
      declined: "rgb(var(--color-error))",
      completed: "rgb(var(--color-goldsolid))",
    } as Record<string, string>
  )[status] ?? "rgb(var(--color-faint))";
}

export function StarRow({
  value,
  onRate,
  size = 22,
}: {
  value: number;
  onRate?: (n: number) => void;
  size?: number;
}) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onRate?.(n)}
          style={{ fontSize: size, lineHeight: 1, cursor: onRate ? "pointer" : "default" }}
          className={n <= value ? "text-gold" : "text-line/25"}
        >
          ★
        </span>
      ))}
    </div>
  );
}
