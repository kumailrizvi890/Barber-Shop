export function BarberPole({
  width = 20,
  height = 46,
  radius = 9,
}: {
  width?: number;
  height?: number;
  radius?: number;
}) {
  return (
    <div
      className="barber-pole shrink-0 animate-poleScroll"
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
      }}
    />
  );
}

export function Wordmark({ size = 20, sub }: { size?: number; sub?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <BarberPole width={size} height={size * 2.3} />
      <div className="font-headline tracking-tight" style={{ fontSize: size }}>
        FADE <span className="text-gold">KINGS</span>
        {sub && <span className="ml-1.5 font-body text-[10px] font-normal text-muted align-middle">{sub}</span>}
      </div>
    </div>
  );
}
