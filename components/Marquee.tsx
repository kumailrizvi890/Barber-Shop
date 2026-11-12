"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

// Loops a duplicated item set by translating exactly one measured set-width
// (in real pixels, via ResizeObserver) rather than a CSS "-50%" — percentage
// looping can drift a fraction of a pixel from sub-pixel text layout and
// shows as a visible stitch at the wrap point. Pixel-exact measurement can't drift.
export function Marquee({ items, speedPxPerSec = 55 }: { items: string[]; speedPxPerSec?: number }) {
  const setRef = useRef<HTMLDivElement>(null);
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    const el = setRef.current;
    if (!el) return;
    const measure = () => setSetWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items]);

  const duration = setWidth > 0 ? setWidth / speedPxPerSec : 20;

  return (
    <div>
      <div className="overflow-hidden">
        <div
          className="flex w-max"
          style={
            setWidth > 0
              ? ({
                  "--marquee-w": `${setWidth}px`,
                  animation: `marquee-precise ${duration}s linear infinite`,
                  willChange: "transform",
                } as CSSProperties)
              : undefined
          }
        >
          <div ref={setRef} className="flex w-max shrink-0">
            {items.map((t, i) => (
              <div key={i} className="whitespace-nowrap px-[18px] font-headline text-[13px] tracking-wide text-gold">
                {t}
              </div>
            ))}
          </div>
          <div aria-hidden className="flex w-max shrink-0">
            {items.map((t, i) => (
              <div key={i} className="whitespace-nowrap px-[18px] font-headline text-[13px] tracking-wide text-gold">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Barber-pole accent: a thin strip of classic red / white / blue
          stripes that drifts like a spinning pole, under the ticker. */}
      <div className="barber-pole-animated h-2 w-full" aria-hidden="true" />
    </div>
  );
}
