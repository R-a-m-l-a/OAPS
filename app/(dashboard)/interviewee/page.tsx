"use client";

/**
 * Interviewee (candidate) page. Webcam and AI monitoring run only here.
 * Session data is synced to the server so the interviewer dashboard can display it.
 */

import { useCallback } from "react";
import {
  DashboardLayout,
  LiveFeedPanel,
  MetricsPanel,
  RiskIndicator,
} from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { useMonitoring } from "@/hooks/useMonitoring";
import { useSessionSync } from "@/hooks/useSessionSync";
import { useSessionStore } from "@/store/sessionStore";
import { countEventsByType } from "@/lib/utils/metrics-aggregator";

export default function IntervieweePage() {
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const riskScore = useSessionStore((s) => s.riskScore);
  const events = useSessionStore((s) => s.events);
  const startSession = useSessionStore((s) => s.startSession);
  const endSession = useSessionStore((s) => s.endSession);

  const monitoring = useMonitoring();
  const { pushStatus } = useSessionSync(monitoring.timeQuality.focusRatio);

  const gazeAlerts = countEventsByType(events, "GAZE_AWAY");
  const faceAbsent = countEventsByType(events, "FACE_ABSENT");
  const objectDetections = countEventsByType(events, "OBJECT_DETECTED");
  const tabSwitches = countEventsByType(events, "TAB_SWITCH");
  const showOverlays = isSessionActive && monitoring.aiStatus === "ready";

  const handleStartSession = useCallback(() => {
    startSession();
    pushStatus("start");
  }, [startSession, pushStatus]);

  const handleEndSession = useCallback(() => {
    endSession();
    pushStatus("end");
  }, [endSession, pushStatus]);

  return (
    <DashboardLayout
      headerSlot={
        <>
          <span
            className={`rounded-xl px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${
              monitoring.aiStatus === "ready"
                ? "bg-[var(--blue-50)] text-[var(--blue-700)]"
                : monitoring.aiStatus === "loading"
                  ? "bg-amber-50 text-amber-700"
                  : monitoring.aiStatus === "error"
                    ? "bg-rose-50 text-rose-700"
                    : "bg-slate-50 text-slate-400"
            }`}
          >
            {monitoring.aiStatus === "ready"
              ? "AI Ready"
              : monitoring.aiStatus === "loading"
                ? "Loading AI…"
                : monitoring.aiStatus === "error"
                  ? "AI Error"
                  : "AI Idle"}
          </span>
          {isSessionActive && monitoring.aiStatus === "ready" && (
            <span
              className={`rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${
                monitoring.gazeState === "NORMAL"
                  ? "bg-emerald-50 text-emerald-700"
                  : monitoring.gazeState === "MONITORING_DEVIATION"
                    ? "bg-amber-50 text-amber-700"
                    : monitoring.gazeState === "ALERT_ACTIVE"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-slate-50 text-slate-400"
              }`}
            >
              {monitoring.gazeState.replace(/_/g, " ")}
            </span>
          )}
          <Button
            id="btn-start-session"
            onClick={handleStartSession}
            disabled={isSessionActive}
          >
            Start Session
          </Button>
          <Button
            id="btn-end-session"
            variant="secondary"
            onClick={handleEndSession}
            disabled={!isSessionActive}
          >
            End Session
          </Button>
        </>
      }

     
      liveFeedSlot={
        <>
          {/* Hook returns ref-backed values intentionally for real-time monitoring UI. */}
          {/* eslint-disable react-hooks/refs */}
          <LiveFeedPanel
            ref={monitoring.videoRef}
            stream={monitoring.webcam.stream}
            status={monitoring.webcam.status}
            errorMessage={monitoring.webcam.errorMessage}
            gazeResult={monitoring.lastGazeResult}
            objectResult={monitoring.lastObjectResult}
            showOverlays={showOverlays}
            gazeState={monitoring.gazeState}
          />
          {/* eslint-enable react-hooks/refs */}
        </>
      }
  
    />
  );
}
