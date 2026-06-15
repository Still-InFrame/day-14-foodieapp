"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

// Camera barcode scanner modal. Decodes EAN/UPC from the live camera via ZXing
// and reports the digits. Includes a manual-entry fallback for desktops without
// a camera. Camera access needs a secure context (HTTPS or localhost).
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    let active = true;
    let controls: { stop: () => void } | undefined;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result) => {
        if (result && active) {
          active = false;
          controls?.stop();
          onDetectedRef.current(result.getText());
        }
      })
      .then((c) => {
        controls = c;
      })
      .catch(() => {
        setError("Couldn't access the camera. Type the barcode digits below instead.");
      });

    return () => {
      active = false;
      controls?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-extrabold text-ink">Scan a barcode</h3>
          <button onClick={onClose} aria-label="Close scanner" className="text-xl text-ink-soft">
            ✕
          </button>
        </div>
        <div className="aspect-square overflow-hidden rounded-2xl bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        </div>
        {error && <p className="mt-2 text-sm text-grade-e">{error}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const code = manual.replace(/\D/g, "");
            if (code) onDetectedRef.current(code);
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode="numeric"
            placeholder="…or type the barcode digits"
            className="flex-1 rounded-full border border-cream-deep bg-cream/40 px-4 py-2 text-sm outline-none focus:border-brand"
          />
          <button className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white">Go</button>
        </form>
      </div>
    </div>
  );
}
