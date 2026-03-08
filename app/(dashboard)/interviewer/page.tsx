"use client";

/**
 * Interviewer (proctor) dashboard. Displays risk score, event logs, and
 * session analytics from the server-side store (populated by interviewee sync).
 * Gemini AI analysis is triggered manually from here.
 */

import { useCallback } from "react";
import {
  DashboardLayout,
  MetricsPanel,
  RiskIndicator,
  AIAnalysisPanel,
} from "@/components/dashboard";
import { Button } from "@/components/ui/Button";
import { useInterviewerData } from "@/hooks/useInterviewerData";
import { useGeminiAnalysis } from "@/hooks/useGeminiAnalysis";
import { countEventsByType, buildGeminiPayload } from "@/lib/utils/metrics-aggregator";

const MIN_DURATION_FOR_REPORT_MS = 5000;

export default function InterviewerPage() {
  const data = useInterviewerData();
  const gemini = useGeminiAnalysis();

  const {
    events,
    riskScore,
    focusRatio,
    isSessionActive,
    sessionStartTime,
    sessionEndTime,
  } = data;

  const gazeAlerts = countEventsByType(events, "GAZE_AWAY");
  const faceAbsent = countEventsByType(events, "FACE_ABSENT");
  const objectDetections = countEventsByType(events, "OBJECT_DETECTED");
  const tabSwitches = countEventsByType(events, "TAB_SWITCH");

  const computedDurationMs =
    sessionStartTime && sessionEndTime
      ? sessionEndTime - sessionStartTime
      : isSessionActive && sessionStartTime
        // eslint-disable-next-line react-hooks/purity
        ? Date.now() - sessionStartTime
        : 0;
  const elapsedLabel =
    sessionStartTime && (isSessionActive || sessionEndTime)
      ? formatElapsed(computedDurationMs)
      : "00:00";

  const sessionEnded =
    !isSessionActive && sessionStartTime !== null && sessionEndTime !== null;
  const durationSufficient = computedDurationMs >= MIN_DURATION_FOR_REPORT_MS;
  const canGenerateReport =
    sessionEnded && events.length > 0 && durationSufficient && !gemini.report;

  const handleGenerateReport = useCallback(() => {
    if (!sessionStartTime || !sessionEndTime) return;
    const durationMs = sessionEndTime - sessionStartTime;
    const payload = buildGeminiPayload(events, durationMs, focusRatio);
    gemini.generateReport({ payload });
  }, [events, sessionStartTime, sessionEndTime, focusRatio, gemini]);

  const handleResetAll = useCallback(async () => {
    gemini.resetReport();
    try {
      await fetch("/api/session/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to reset server session:", err);
    }
  }, [gemini]);

  return (
    <DashboardLayout
      headerSlot={
        <>
          <span className="rounded-xl bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Interviewer View
          </span>
          {canGenerateReport && (
            <Button
              id="btn-generate-report"
              onClick={handleGenerateReport}
              disabled={gemini.isLoading}
            >
              {gemini.isLoading ? "Analyzing…" : "Generate AI Report"}
            </Button>
          )}
          {sessionEnded && events.length > 0 && !durationSufficient && (
            <span className="rounded-xl bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700">
              Session too short for analysis
            </span>
          )}
          {(sessionEnded || events.length > 0) && (
            <Button
              id="btn-reset-all"
              variant="danger"
              onClick={handleResetAll}
              disabled={isSessionActive}
            >
              Clear Session Data
            </Button>
          )}
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
          elapsedLabel={elapsedLabel}
          riskScore={riskScore}
          focusRatio={focusRatio}
        />
      }
      riskSlot={<RiskIndicator riskScore={riskScore} />}
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

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}
