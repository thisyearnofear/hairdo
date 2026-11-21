"use client";

import { useEffect, useRef, useState } from "react";

/**
 * P2-1 Live mirror beta (MediaPipe spike, step 1: plumbing + framing guide).
 * Rendered only when `?mirror=beta` is present. Own camera stream, mirrored
 * preview, oval framing guide, capture-to-photo. Never replaces the existing
 * upload / camera-modal flow — camera denial falls back to upload copy.
 *
 * Open follow-up (P2-1b): wire `kaltwrk/experiment-001`-style face-mesh
 * overlay via a lazily-imported landmarker. The panel + flag + capture
 * plumbing shipped here is the seam it plugs into.
 */
export function MirrorBeta({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let active: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        active = s;
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => {
        if (!cancelled) setError("Camera unavailable — upload a photo instead.");
      });
    return () => {
      cancelled = true;
      active?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      setError("Mirror not ready yet — hold still a second.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Capture failed — try the regular Selfie button.");
      return;
    }
    // Un-mirror for the saved photo (preview is mirrored via CSS).
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL("image/jpeg", 0.92);
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    onCapture(url);
  };

  return (
    <div className="relative w-full max-w-md rounded-lg overflow-hidden border border-amber/30 glass-warm">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] tracking-[0.2em] uppercase text-amber/80">
          Mirror · beta
        </span>
        <span className="text-[10px] tracking-wide opacity-40 font-display italic">
          framing guide — face-mesh coming
        </span>
      </div>
      {error ? (
        <p className="px-4 pb-4 text-xs opacity-60">{error}</p>
      ) : (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full aspect-square object-cover -scale-x-100"
          />
          {/* Oval framing guide */}
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-2/3 aspect-[3/4] rounded-[50%] border-2 border-dashed border-amber/50" />
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <button
              onClick={capture}
              className="w-16 h-16 rounded-full bg-white border-4 border-amber/60 flex items-center justify-center press-scale"
              aria-label="Capture mirror frame"
            >
              <div className="w-12 h-12 rounded-full bg-gray-800" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
