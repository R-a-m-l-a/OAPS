"use client";

import { useEffect, useRef } from "react";

import { Card } from "@/components/ui/Card";

type Props = {
  stream: MediaStream | null;
  status: "idle" | "requesting" | "ready" | "denied" | "error";
  errorMessage?: string | null;
};

export function LiveFeedPanel({ stream, status, errorMessage }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!stream) {
      video.srcObject = null;
      return;
    }

    video.srcObject = stream;
    void video.play().catch(() => {
      // Autoplay may be blocked; user gesture (Start Session) typically allows it.
    });

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  const helperText = (() => {
    if (status === "idle") return "Start a session to request webcam access.";
    if (status === "requesting") return "Requesting camera permission…";
    if (status === "denied") return errorMessage ?? "Camera permission denied.";
    if (status === "error") return errorMessage ?? "Webcam error.";
    return "Live preview";
  })();

  return (
    <Card
      title="Live Feed"
      subtitle={helperText}
      className="h-full"
    >
      <div className="relative overflow-hidden rounded-lg border border-sky-100 bg-sky-50/40">
        <div className="aspect-video w-full">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            playsInline
            muted
          />
        </div>

        {status !== "ready" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <div className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
              {helperText}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
