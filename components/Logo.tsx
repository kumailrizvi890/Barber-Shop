import Link from "next/link";
import { BarberLottie } from "@/components/BarberLottie";

export function Wordmark({ size = 20, sub }: { size?: number; sub?: string }) {
  return (
    <Link href="/auth" className="flex items-center justify-center gap-2">
      <BarberLottie height={size * 1.6} />
      <div className="font-headline tracking-tight" style={{ fontSize: size }}>
        FADE <span className="text-gold">KINGS</span>
        {sub && <span className="ml-1.5 font-body text-[10px] font-normal text-muted align-middle">{sub}</span>}
      </div>
    </Link>
  );
}
