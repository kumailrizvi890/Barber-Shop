"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";

export function RedeemQRModal({
  redemptionId,
  points,
  onClose,
}: {
  redemptionId: string;
  points: number;
  onClose: () => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = `${window.location.origin}/redeem/${redemptionId}`;
    QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: "#0a0a0a", light: "#f5f5f0" } }).then(setQrDataUrl);
  }, [redemptionId]);

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <div onClick={onClose} className="absolute right-5 top-5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/10 text-lg text-primary">
        ✕
      </div>
      <div className="mb-1 font-headline text-lg">SHOW THIS TO YOUR BARBER</div>
      <div className="mb-6 text-xs text-muted">{points.toLocaleString()} points → Free Cut</div>
      {qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt="Redemption QR code" width={280} height={280} className="rounded-2xl border border-gold/25" />
      ) : (
        <div className="flex h-[280px] w-[280px] items-center justify-center rounded-2xl border border-gold/25 text-xs text-faint">Generating…</div>
      )}
      <div className="mt-6 max-w-[280px] text-[12px] leading-relaxed text-faint">
        Your barber scans this to confirm — your points aren't deducted until they do.
      </div>
    </div>,
    document.body
  );
}
