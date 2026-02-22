"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { SessionEvent } from "@/store/sessionStore";
import { useSessionStore } from "@/store/sessionStore";
import { useWebcam } from "@/hooks/useWebcam";

export type MonitoringStatus = "idle" | "starting" | "active" | "stopped";

export type UseMonitoringResult = {
  status: MonitoringStatus;
  elapsedMs: number;
  elapsedLabel: string;
  webcam: ReturnType<typeof useWebcam>;
};

function formatElapsed(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return hours > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

function createEventId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useMonitoring(): UseMonitoringResult {
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const sessionStartTime = useSessionStore((s) => s.sessionStartTime);
  const addEvent = useSessionStore((s) => s.addEvent);

  const webcam = useWebcam();

  const [status, setStatus] = useState<MonitoringStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);

  const rafIdRef = useRef<number | null>(null);
  const lastTickMsRef = useRef<number>(0);

  // Session timer loop (requestAnimationFrame)
  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setElapsedMs(0);
      return;
    }

    lastTickMsRef.current = 0;

    const loop = (now: number) => {
      // Throttle state updates to ~4Hz to minimize re-renders.
      if (now - lastTickMsRef.current >= 250) {
        setElapsedMs(Date.now() - sessionStartTime);
        lastTickMsRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isSessionActive, sessionStartTime]);

  // Webcam lifecycle
  useEffect(() => {
    if (!isSessionActive) {
      webcam.stop();
      setStatus("stopped");
      return;
    }

    let isCancelled = false;

    const start = async () => {
      setStatus("starting");
      await webcam.requestAccess();
      if (isCancelled) return;
      setStatus(webcam.status === "ready" ? "active" : "starting");
    };

    start();

    return () => {
      isCancelled = true;
    };
    // Depend on the memoized webcam helpers to avoid stale closures.
  }, [isSessionActive, webcam.requestAccess, webcam.stop, webcam.status]);

  // Tab switch detection (visibilitychange OR blur)
  // Note: Switching away often triggers multiple signals (visibilitychange + blur).
  // To avoid double/triple counting, we coalesce events within a short window.
  useEffect(() => {
    if (!isSessionActive) return;

    let lastLoggedAt = 0;
    const COALESCE_WINDOW_MS = 800;

    const logTabSwitch = (reason: "visibilitychange" | "blur") => {
      const now = Date.now();
      if (now - lastLoggedAt < COALESCE_WINDOW_MS) return;
      lastLoggedAt = now;

      const event: SessionEvent = {
        id: createEventId(),
        type: "TAB_SWITCH",
        timestamp: now,
        severity: "warning",
        metadata: {
          reason,
          visibilityState: document.visibilityState,
        },
      };
      addEvent(event);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        logTabSwitch("visibilitychange");
      }
    };

    const onBlur = () => {
      logTabSwitch("blur");
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
    };
  }, [isSessionActive, addEvent]);

  const elapsedLabel = useMemo(() => formatElapsed(elapsedMs), [elapsedMs]);

  return useMemo(
    () => ({ status, elapsedMs, elapsedLabel, webcam }),
    [status, elapsedMs, elapsedLabel, webcam],
  );
}
