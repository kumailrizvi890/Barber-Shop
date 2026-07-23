"use client";

import Lottie from "lottie-react";
import barberAnimation from "@/lib/animations/barber.json";

// The source composition is a 1920x1080 canvas, but the actual pole
// graphic only occupies a narrow ~243x677 region centered inside it.
// Crop to that region (via an oversized, offset inner render) instead
// of showing a mostly-empty 16:9 box around a sliver of content.
const CANVAS_W = 1920;
const CANVAS_H = 1080;
const CONTENT_W = 243;
const CONTENT_H = 677;
const CONTENT_CX = 960;
const CONTENT_CY = 538;

export function BarberLottie({ height = 60, className }: { height?: number; className?: string }) {
  const width = height * (CONTENT_W / CONTENT_H);
  const scale = width / CONTENT_W;
  const renderW = CANVAS_W * scale;
  const renderH = CANVAS_H * scale;
  const left = width / 2 - CONTENT_CX * scale;
  const top = height / 2 - CONTENT_CY * scale;

  return (
    <div className={className} style={{ width, height, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", width: renderW, height: renderH, left, top }}>
        <Lottie animationData={barberAnimation} loop autoplay style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
}
