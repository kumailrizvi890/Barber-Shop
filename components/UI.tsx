import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export function GoldButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-xl py-[15px] font-body font-extrabold text-[15px] transition-colors " +
        (props.disabled
          ? "bg-surface2 text-faint cursor-not-allowed"
          : "bg-goldsolid text-bg cursor-pointer hover:opacity-90") +
        " " +
        className
      }
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={
        "w-full rounded-xl py-[13px] font-body font-semibold text-[13.5px] border border-line/15 bg-transparent text-secondary cursor-pointer hover:border-line/30 " +
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
    <div style={style} className={"bg-card border border-line/[0.07] rounded-2xl " + className}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11.5px] font-bold text-muted tracking-wide mb-2">{children}</div>
  );
}

export function BarberAvatar({ initials, size = 52, rounded = 12 }: { initials: string; size?: number; rounded?: number }) {
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
    <div
      className="text-[10.5px] font-extrabold tracking-wide px-[9px] py-1 rounded-lg"
      style={{ background: s.bg, color: s.color }}
    >
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
    }[status] ?? "rgb(var(--color-faint))"
  );
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
