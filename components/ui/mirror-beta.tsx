"use client";

import { useEffect, useRef, useState } from "react";

/**
 * P2-1 Live mirror beta (kaltwrk/experiment-001-style face mesh).
 * Rendered only when `?mirror=beta` is present. Own camera stream, mirrored
 * preview, oval framing guide, capture-to-photo. Never replaces the existing
 * upload / selfie flow — camera denial falls back to upload copy.
 *
 * P2-1b: face mesh via a lazily-imported MediaPipe FaceLandmarker
 * (@mediapipe/tasks-vision, pinned 1.2.3). The model + wasm load only when
 * this panel mounts, so first paint pays nothing. If the model fails
 * (offline, CDN blocked, WebGL unavailable), the oval guide stays and the
 * panel works exactly as before — mesh is enhancement, not requirement.
 */
type MeshState = "loading" | "on" | "off";

export function MirrorBeta({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mesh, setMesh] = useState<MeshState>("loading");

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

  // Face-mesh loop — fully dynamic import, torn down on unmount.
  // On camera error the effect never runs; status copy reads `error`
  // directly so no setState-in-effect is needed.
  useEffect(() => {
    if (error) return;
    let cancelled = false;
    let raf = 0;
    let landmarker: { detectForVideo: (v: HTMLVideoElement, t: number) => { faceLandmarks?: Array<Array<{ x: number; y: number }>> }; close: () => void } | null = null;

    const start = async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        if (cancelled) return;
        const fileset = await vision.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm"
        );
        if (cancelled) return;
        landmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        if (cancelled) {
          landmarker.close();
          landmarker = null;
          return;
        }
        setMesh("on");

        const tick = () => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && landmarker && video.readyState >= 2 && video.videoWidth > 0) {
            if (canvas.width !== video.videoWidth) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              try {
                const res = landmarker.detectForVideo(video, performance.now());
                const points = res.faceLandmarks?.[0];
                if (points) {
                  // Sparse amber constellation — every 6th landmark reads as
                  // mesh without obscuring the face.
                  ctx.fillStyle = "rgba(232, 184, 106, 0.85)";
                  for (let i = 0; i < points.length; i += 6) {
                    const p = points[i];
                    ctx.beginPath();
                    ctx.arc(p.x * canvas.width, p.y * canvas.height, 2, 0, Math.PI * 2);
                    ctx.fill();
                  }
                }
              } catch {
                // Per-frame failures are transient (timestamp ordering) — skip.
              }
            }
          }
          if (!cancelled) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setMesh("off");
      }
    };
    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      try {
        landmarker?.close();
      } catch {
        // Already closed — ignore.
      }
      landmarker = null;
    };
  }, [error]);

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
          {mesh === "on" && !error
            ? "live mesh"
            : mesh === "loading" && !error
              ? "starting mesh…"
              : "framing guide"}
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
          {mesh === "on" && !error && (
            <canvas
              ref={canvasRef}
              aria-hidden
              className="absolute inset-0 w-full h-full -scale-x-100 pointer-events-none"
            />
          )}
          {(mesh !== "on" || error) && (
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-2/3 aspect-[3/4] rounded-[50%] border-2 border-dashed border-amber/50" />
            </div>
          )}
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
