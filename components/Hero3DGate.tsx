"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Hero3D = dynamic(() => import("@/components/Hero3D").then((m) => m.Hero3D), { ssr: false });

// Three.js is a large chunk — only fetch and mount it for viewports wide
// enough to actually show it (matches the `lg:` breakpoint on the wrapper).
export function Hero3DGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setShow(mq.matches);
    const listener = (e: MediaQueryListEvent) => setShow(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  if (!show) return null;
  return <Hero3D />;
}
