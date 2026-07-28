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
          ? "bg-[#2a2a26] text-faint cursor-not-allowed"
          : "bg-gold text-bg cursor-pointer hover:bg-[#e0bc47]") +
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
        "w-full rounded-xl py-[13px] font-body font-semibold text-[13.5px] border border-white/15 bg-transparent text-secondary cursor-pointer hover:border-white/30 " +
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
    <div style={style} className={"bg-card border border-white/[0.07] rounded-2xl " + className}>
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
          "repeating-linear-gradient(135deg, #232323 0px, #232323 6px, #1a1a1a 6px, #1a1a1a 12px)",
      }}
    >
      {initials}
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgba(255,255,255,0.08)", color: "#a3a39c", label: "PENDING" },
  approved: { bg: "rgba(95,206,137,0.15)", color: "#5fce89", label: "APPROVED" },
  declined: { bg: "rgba(224,112,112,0.15)", color: "#e07070", label: "DECLINED" },
  completed: { bg: "rgba(212,175,55,0.15)", color: "#D4AF37", label: "COMPLETED" },
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
  return { pending: "#6b6b66", approved: "#5fce89", declined: "#e07070", completed: "#D4AF37" }[status] ?? "#6b6b66";
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
          className={n <= value ? "text-gold" : "text-[#3a3a36]"}
        >
          ★
        </span>
      ))}
    </div>
  );
}
