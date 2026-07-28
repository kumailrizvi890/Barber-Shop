"use client";

import { statusStripeColor } from "@/components/UI";

const STATUS_LABELS: Record<string, string> = {
  completed: "Completed",
  approved: "Upcoming",
  pending: "Pending",
  declined: "Declined",
};

// ── Vertical bar chart (magnitude over time, e.g. weekly revenue) ────────
export function BarChart({
  data,
  valueLabel,
  height = 120,
}: {
  data: { label: string; value: number }[];
  valueLabel: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="w-full">
      <div className="flex gap-2" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="group flex h-full min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="relative flex w-full flex-1 items-end justify-center">
              {d.value > 0 && (
                <div className="pointer-events-none absolute -top-5 whitespace-nowrap text-[9.5px] font-bold text-gold opacity-0 transition-opacity group-hover:opacity-100">
                  {valueLabel(d.value)}
                </div>
              )}
              <div
                title={`${d.label}: ${valueLabel(d.value)}`}
                className="w-full max-w-[22px] rounded-t-[4px] bg-goldsolid transition-[opacity] hover:opacity-80"
                style={{ height: `${Math.max(3, (d.value / max) * 100)}%`, opacity: d.value > 0 ? 1 : 0.12 }}
              />
            </div>
            <div className="text-[9.5px] text-faint">{d.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal ranking bars (e.g. top barbers by revenue) ────────────────
export function HBarChart({
  data,
  valueLabel,
}: {
  data: { label: string; value: number }[];
  valueLabel: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-3">
      {data.map((d, i) => (
        <div key={i} title={`${d.label}: ${valueLabel(d.value)}`}>
          <div className="mb-1 flex items-baseline justify-between text-[12px]">
            <span className="font-bold text-secondary">{d.label}</span>
            <span className="font-bold text-gold">{valueLabel(d.value)}</span>
          </div>
          <div className="h-[7px] w-full overflow-hidden rounded-full bg-line/[0.08]">
            <div
              className="h-full rounded-full bg-goldsolid transition-[width]"
              style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart (state/identity breakdown, e.g. booking status) ─────────
export function DonutChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const r = 54;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * r;
  const gap = total > 1 ? 3 : 0;

  let offset = 0;
  const segments = data.map((d) => {
    const len = Math.max(0, (d.count / total) * circumference - gap);
    const seg = { ...d, dasharray: `${len} ${circumference - len}`, dashoffset: -offset };
    offset += (d.count / total) * circumference;
    return seg;
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={140} height={140} viewBox="0 0 140 140" className="shrink-0 -rotate-90">
        <circle cx={70} cy={70} r={r} fill="none" stroke="rgb(var(--color-line) / 0.10)" strokeWidth={strokeWidth} />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={70}
            cy={70}
            r={r}
            fill="none"
            stroke={statusStripeColor(s.status)}
            strokeWidth={strokeWidth}
            strokeDasharray={s.dasharray}
            strokeDashoffset={s.dashoffset}
            strokeLinecap="round"
          >
            <title>
              {STATUS_LABELS[s.status] ?? s.status}: {s.count}
            </title>
          </circle>
        ))}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-[12px]">
            <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: statusStripeColor(d.status) }} />
            <span className="font-bold text-secondary">{STATUS_LABELS[d.status] ?? d.status}</span>
            <span className="text-faint">
              {d.count} · {Math.round((d.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
