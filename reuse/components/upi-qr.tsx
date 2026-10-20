"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** A QR code (UPI payment or a link) on a white tile: scanners need the contrast. */
export function UpiQr({ payload, label }: { payload: string; label: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toString(payload, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#000000", light: "#ffffff" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(null));
    return () => {
      alive = false;
    };
  }, [payload]);
  return (
    <div
      role="img"
      aria-label={label}
      className="mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-2xl bg-white p-2 [&_svg]:h-full [&_svg]:w-full"
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
}
