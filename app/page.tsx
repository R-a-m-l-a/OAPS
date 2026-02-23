"use client";

/**
 * Home Page — Phase 5.2: Session Duration Integrity
 *
 * Key fix: session duration is read from store timestamps (sessionStartTime /
 * sessionEndTime), not from the monitoring hook's live elapsedMs which resets
 * to 0 when the session ends. The Gemini payload is therefore always accurate.
 */

import { useCallback, useRef } from "react";
import {
  DashboardLayout,
  LiveFeedPanel,
  MetricsPanel,
  RiskIndicator,
  AIAnalysisPanel,
} from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { useMonitoring } from "@/hooks/useMonitoring";
import { useGeminiAnalysis } from "@/hooks/useGeminiAnalysis";
import { useSessionStore } from "@/store/sessionStore";
import {
  countEventsByType,
  buildGeminiPayload,
} from "@/lib/utils/metrics-aggregator";
import type { GeminiPayload } from "@/types/metrics";

/** Minimum session duration required before Gemini analysis is offered (ms). */
const MIN_DURATION_FOR_REPORT_MS = 5000;

export default function HomePage() {
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const riskScore = useSessionStore((s) => s.riskScore);
  const events = useSessionStore((s) => s.events);
  const sessionStartTime = useSessionStore((s) => s.sessionStartTime);
  const sessionEndTime = useSessionStore((s) => s.sessionEndTime);

  const startSession = useSessionStore((s) => s.startSession);
  const endSession = useSessionStore((s) => s.endSession);
  const resetSession = useSessionStore((s) => s.resetSession);

  const monitoring = useMonitoring();
  const gemini = useGeminiAnalysis();

  const gazeAlerts = countEventsByType(events, "GAZE_AWAY");
  const faceAbsent = countEventsByType(events, "FACE_ABSENT");
  const objectDetections = countEventsByType(events, "OBJECT_DETECTED");
  const tabSwitches = countEventsByType(events, "TAB_SWITCH");

  const showOverlays = isSessionActive && monitoring.aiStatus === "ready";

  // ── Frozen payload ref — captured at end-session time ─────────────────────
  // We store the payload in a ref so it survives state resets between
  // "End Session" and "Generate Report" being clicked.
  const frozenPayloadRef = useRef<GeminiPayload | null>(null);

  // ── Compute actual session duration from store timestamps ─────────────────
  // Use sessionEndTime (set by endSession()) and sessionStartTime.
  // Both are set by the store, not affected by component re-renders or
  // monitoring hook timer resets.
  const computedDurationMs = (() => {
    if (sessionEndTime && sessionStartTime) {
      return sessionEndTime - sessionStartTime;
    }
    if (isSessionActive && sessionStartTime) {
      return Date.now() - sessionStartTime;
    }
    return 0;
  })();

  const sessionEnded =
    !isSessionActive && sessionStartTime !== null && sessionEndTime !== null;
  const durationSufficient = computedDurationMs >= MIN_DURATION_FOR_REPORT_MS;
  const canGenerateReport =
    sessionEnded && events.length > 0 && durationSufficient && !gemini.report;

  // ── End session: capture frozen snapshot immediately ─────────────────────
  const handleEndSession = useCallback(() => {
    // Capture snapshot BEFORE endSession() mutates the store
    if (isSessionActive && sessionStartTime) {
      const endNow = Date.now();
      const durationMs = endNow - sessionStartTime;
      const durationSec = Math.floor(durationMs / 1000);

      if (!sessionStartTime || durationSec <= 0) {
        console.warn("[page] Invalid session duration detected:", durationSec);
      }

      // Compute focusRatio from time-quality tracking in the monitoring hook
      const focusRatio = monitoring.timeQuality.focusRatio;

      // Build and freeze the payload snapshot now — before any state resets
      frozenPayloadRef.current = buildGeminiPayload(
        events,
        durationMs,
        focusRatio,
      );
    }

    endSession();
  }, [isSessionActive, sessionStartTime, events, monitoring.timeQuality.focusRatio, endSession]);

  // ── Generate report: always use the frozen snapshot ───────────────────────
  const handleGenerateReport = useCallback(() => {
    if (!frozenPayloadRef.current) {
      // Fallback: attempt to build from store if snapshot somehow missing
      if (sessionStartTime && sessionEndTime) {
        const durationMs = sessionEndTime - sessionStartTime;
        frozenPayloadRef.current = buildGeminiPayload(
          events,
          durationMs,
          monitoring.timeQuality.focusRatio,
        );
      } else {
        return;
      }
    }

    gemini.generateReport({ payload: frozenPayloadRef.current });
  }, [gemini, events, sessionStartTime, sessionEndTime, monitoring.timeQuality.focusRatio]);

  // ── Reset: clear frozen snapshot too ─────────────────────────────────────
  const handleReset = useCallback(() => {
    frozenPayloadRef.current = null;
    resetSession();
    gemini.resetReport();
  }, [resetSession, gemini]);

  return (
    <DashboardLayout
      headerSlot={
        <>
          {/* AI status badge */}
          <span
            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors duration-200 ${monitoring.aiStatus === "ready"
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

          {/* Gaze state badge */}
          {isSessionActive && monitoring.aiStatus === "ready" && (
            <span
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${monitoring.gazeState === "NORMAL"
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
            onClick={startSession}
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

          {canGenerateReport && (
            <Button
              id="btn-generate-report"
              variant="primary"
              onClick={handleGenerateReport}
              disabled={gemini.isLoading}
            >
              {gemini.isLoading ? "Analyzing…" : "Generate AI Report"}
            </Button>
          )}

          {/* Show "too short" hint inline in the header */}
          {sessionEnded && events.length > 0 && !durationSufficient && (
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              Session too short for analysis
            </span>
          )}

          <Button
            id="btn-reset-session"
            variant="danger"
            onClick={handleReset}
            disabled={isSessionActive}
          >
            Reset
          </Button>
        </>
      }
      metricsSlot={
        <MetricsPanel
          isSessionActive={isSessionActive}
          totalEvents={events.length}
          gazeAlerts={gazeAlerts}
          faceAbsent={faceAbsent}
          objectDetections={objectDetections}
          tabSwitches={tabSwitches}
          elapsedLabel={monitoring.elapsedLabel}
          riskScore={riskScore}
          focusRatio={monitoring.timeQuality.focusRatio}
        />
      }
      riskSlot={<RiskIndicator riskScore={riskScore} />}
      liveFeedSlot={
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
      }
      aiPanelSlot={
        <AIAnalysisPanel
          events={events}
          isSessionActive={isSessionActive}
          report={gemini.report}
          isLoading={gemini.isLoading}
          error={gemini.error}
          onGenerateReport={handleGenerateReport}
        />
      }
    />
  );
}
