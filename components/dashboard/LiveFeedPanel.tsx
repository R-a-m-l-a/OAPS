"use client";

/**
 * LiveFeedPanel — Phase 5
 *
 * Displays webcam video feed with AI overlays.
 * Passes gazeState through to GazeOverlay for state-aware colour coding.
 */

import { forwardRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { GazeOverlay } from "@/components/ai-overlays/GazeOverlay";
import { ObjectDetectionOverlay } from "@/components/ai-overlays/ObjectDetectionOverlay";
import type { GazeResult, ObjectDetectionResult } from "@/types/metrics";

type Props = {
  stream: MediaStream | null;
  status: "idle" | "requesting" | "ready" | "denied" | "error";
  errorMessage?: string | null;
  gazeResult?: GazeResult | null;
  objectResult?: ObjectDetectionResult | null;
  showOverlays?: boolean;
  /** Current gaze state from the state machine */
  gazeState?: string;
};

const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 360;

export const LiveFeedPanel = forwardRef<HTMLVideoElement, Props>(
  function LiveFeedPanel(
    { stream, status, errorMessage, gazeResult, objectResult, showOverlays, gazeState },
    ref,
  ) {
    useEffect(() => {
      const videoEl =
        ref && typeof ref === "object" ? ref.current : null;
      if (!videoEl) return;

      if (!stream) {
        videoEl.srcObject = null;
        return;
      }

      videoEl.srcObject = stream;
      void videoEl.play().catch(() => { });

      return () => {
        videoEl.srcObject = null;
      };
    }, [stream, ref]);

    const helperText = (() => {
      if (status === "idle") return "Start a session to request webcam access.";
      if (status === "requesting") return "Requesting camera permission…";
      if (status === "denied") return errorMessage ?? "Camera permission denied.";
      if (status === "error") return errorMessage ?? "Webcam error.";
      return "Live preview";
    })();

    const isReady = status === "ready";

    return (
      <Card title="Live Feed" subtitle={helperText} className="h-full">
        <div className="relative overflow-hidden rounded-lg border border-sky-100 bg-sky-50/40">
          <div className="aspect-video w-full">
            <video
              ref={ref}
              className="h-full w-full object-cover"
              autoPlay
              playsInline
              muted
            />
          </div>

          {isReady && showOverlays && (
            <>
              <GazeOverlay
                result={gazeResult ?? null}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
                gazeState={gazeState}
              />
              <ObjectDetectionOverlay
                result={objectResult ?? null}
                width={VIDEO_WIDTH}
                height={VIDEO_HEIGHT}
              />
            </>
          )}

          {!isReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <div className="rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
                {helperText}
              </div>
            </div>
          )}

          {isReady && showOverlays && (
            <div className="absolute left-2 top-2 rounded-full bg-sky-600/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              AI Active
            </div>
          )}
        </div>
      </Card>
    );
  },
);
