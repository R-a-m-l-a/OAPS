"use client";

/**
 * AIAnalysisPanel — Phase 7 Elegant Blue
 *
 * Gemini analysis report + coalesced event log with refined styling.
 */

import React, { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import type { SessionEvent } from "@/store/sessionStore";
import type { GeminiAnalysisResponse } from "@/types/api";

type Props = {
  events: SessionEvent[];
  isSessionActive: boolean;
  report: GeminiAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
  onGenerateReport: () => void;
};

const SEVERITY_STYLES: Record<SessionEvent["severity"], string> = {
  normal: "border-[var(--border)] bg-[var(--blue-50)]/40 text-[var(--blue-700)]",
  warning: "border-amber-200 bg-amber-50/60 text-amber-700",
  suspicious: "border-rose-200 bg-rose-50/60 text-rose-700",
};

const EVENT_ICON: Record<string, string> = {
  GAZE_AWAY: "👁",
  FACE_ABSENT: "🚫",
  OBJECT_DETECTED: "📦",
  TAB_SWITCH: "🔀",
};

const RELEVANT_TYPES = ["GAZE_AWAY", "FACE_ABSENT", "OBJECT_DETECTED", "TAB_SWITCH"];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function EventRow({ event }: { event: SessionEvent }) {
  const icon = EVENT_ICON[event.type] ?? "ℹ️";
  const style = SEVERITY_STYLES[event.severity];
  const meta = event.metadata;

  const detail = (() => {
    if (event.type === "GAZE_AWAY") {
      const dur =
        typeof meta?.durationMs === "number"
          ? `${((meta.durationMs as number) / 1000).toFixed(1)}s`
          : "–";
      return `sustained ${dur}`;
    }
    if (event.type === "FACE_ABSENT") {
      const dur =
        typeof meta?.durationMs === "number"
          ? `${((meta.durationMs as number) / 1000).toFixed(1)}s`
          : "–";
      return `absent ${dur}`;
    }
    if (event.type === "OBJECT_DETECTED") {
      return `${meta?.label ?? "unknown"} (${meta?.score ? `${Math.round((meta.score as number) * 100)}%` : "–"})`;
    }
    if (event.type === "TAB_SWITCH") {
      return `via ${meta?.reason ?? "unknown"}`;
    }
    return "";
  })();

  return (
    <li
      className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-xs transition-all duration-200 ${style}`}
    >
      <span className="shrink-0 text-sm">{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="font-semibold">{event.type.replace(/_/g, " ")}</span>
        {detail && <span className="ml-1.5 font-normal opacity-75">{detail}</span>}
      </div>
      <time className="shrink-0 font-mono text-[10px] tabular-nums opacity-50">
        {formatTime(event.timestamp)}
      </time>
    </li>
  );
}

export const AIAnalysisPanel = React.memo(function AIAnalysisPanel({
    events,
    isSessionActive,
    report,
    isLoading,
    error,
    onGenerateReport,
}: Props) {
  const relevantEvents = useMemo(
    () =>
      events
        .filter((e) => RELEVANT_TYPES.includes(e.type))
        .slice()
        .reverse(),
    [events],
  );

  const riskLevel =
    (report?.focusScore ?? 100) < 45
      ? "High Risk"
      : (report?.focusScore ?? 100) < 70
        ? "Medium Risk"
        : "Low Risk";

  return (
    <Card
      title="AI Analysis"
      subtitle="Behavioral report and flags"
      className="flex h-full flex-col"
      rightSlot={
        <span
          className={`rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors duration-200 ${
            isSessionActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-50 text-slate-400"
          }`}
        >
          {isSessionActive ? "Live" : "Idle"}
        </span>
      }
    >
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-0.5">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Gemini Analysis
            </h3>
            {!report && !isLoading && !isSessionActive && events.length > 0 && (
              <button
                onClick={onGenerateReport}
                className="rounded-lg bg-[var(--blue-50)] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--blue-700)] transition-colors hover:bg-[var(--blue-100)]"
              >
                Generate Report
              </button>
            )}
          </div>

          {isLoading && (
            <div className="rounded-2xl border border-[var(--blue-200)] bg-[var(--blue-50)]/40 p-5 text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[var(--blue-600)] border-t-transparent" />
              <p className="mt-2 text-[11px] font-medium text-[var(--blue-700)]">
                Synthesizing behavioral metrics...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700">
              <strong>Error:</strong> {error}
            </div>
          )}

          {report && (
            <div className="animate-scale-in space-y-4 rounded-2xl border border-[var(--border)] bg-slate-950 p-5 text-white shadow-xl">
              <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-3.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--blue-300)]">
                  Summary
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                  {report.riskSummary}
                </p>
              </section>

              <section className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Risk Assessment
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-amber-300">{riskLevel}</p>
                  <p className="mt-2 text-xl font-bold tabular-nums text-[var(--blue-300)]">
                    {report.focusScore}%
                  </p>
                  <p className="text-[10px] text-slate-400">Focus Score</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Event Profile
                  </h4>
                  <p className="mt-2 text-xl font-bold tabular-nums text-slate-100">
                    {relevantEvents.length}
                  </p>
                  <p className="text-[10px] text-slate-400">Flagged events</p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                  Observations
                </h4>
                {report.anomaliesDetected.length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {report.anomaliesDetected.map((a, i) => (
                      <li key={i} className="flex items-center gap-2 text-[11px] text-slate-200">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                        {a}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">No anomalies reported.</p>
                )}
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                  Recommendations
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">
                  {report.recommendation}
                </p>
              </section>
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Coalesced Event Log
          </h3>
          {relevantEvents.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              {isSessionActive
                ? "Monitoring - no flags yet."
                : events.length > 0
                  ? "No flagged events in this session."
                  : "Start a session to begin AI monitoring."}
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {relevantEvents.slice(0, 50).map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </Card>
  );
});
