/**
 * Pure metrics aggregation utilities — Phase 5.
 *
 * Transforms SessionEvent arrays into structured summaries for the
 * dashboard, risk calculator, and compressed Gemini payload.
 */

import type { SessionEvent } from "@/store/sessionStore";
import type { GeminiPayload, MetricsSummary, RiskInput } from "@/types/metrics";
import { calculateRiskScore } from "@/lib/utils/risk-calculator";

/**
 * Count events of a specific type from the session log.
 */
export function countEventsByType(events: SessionEvent[], type: string): number {
    return events.filter((e) => e.type === type).length;
}

/**
 * Find the longest duration (ms) among events of a given type.
 * Falls back to 0 if no events or no duration metadata.
 */
export function longestDuration(events: SessionEvent[], type: string): number {
    let longest = 0;
    for (const e of events) {
        if (e.type === type && typeof e.metadata?.durationMs === "number") {
            longest = Math.max(longest, e.metadata.durationMs as number);
        }
    }
    return longest;
}

/**
 * Build a RiskInput from the session event log.
 */
export function buildRiskInput(
    events: SessionEvent[],
    sessionDurationMs: number,
): RiskInput {
    return {
        gazeDeviationCount: countEventsByType(events, "GAZE_AWAY"),
        faceAbsenceCount: countEventsByType(events, "FACE_ABSENT"),
        objectDetectionCount: countEventsByType(events, "OBJECT_DETECTED"),
        tabSwitchCount: countEventsByType(events, "TAB_SWITCH"),
        sessionDurationMs,
    };
}

/**
 * Produce a full MetricsSummary snapshot.
 */
export function aggregateMetrics(
    events: SessionEvent[],
    sessionDurationMs: number,
    focusRatio = 1,
): MetricsSummary {
    const riskInput = buildRiskInput(events, sessionDurationMs);
    const { score, level } = calculateRiskScore(riskInput);

    return {
        gazeDeviationCount: riskInput.gazeDeviationCount,
        faceAbsenceCount: riskInput.faceAbsenceCount,
        objectDetectionCount: riskInput.objectDetectionCount,
        tabSwitchCount: riskInput.tabSwitchCount,
        riskScore: score,
        riskLevel: level,
        sessionDurationMs,
        focusRatio,
        longestGazeAwayMs: longestDuration(events, "GAZE_AWAY"),
    };
}

/**
 * Build the compressed payload for Gemini (Phase 5 — PART 7).
 * No raw event arrays — only structured aggregated data.
 */
export function buildGeminiPayload(
    events: SessionEvent[],
    sessionDurationMs: number,
    focusRatio: number,
): GeminiPayload {
    return {
        sessionDurationSec: Math.round(sessionDurationMs / 1000),
        focusRatio: Math.round(focusRatio * 100) / 100,
        gazeIncidents: countEventsByType(events, "GAZE_AWAY"),
        longestGazeAwaySec:
            Math.round(longestDuration(events, "GAZE_AWAY") / 100) / 10,
        faceAbsenceEvents: countEventsByType(events, "FACE_ABSENT"),
        objectIncidents: countEventsByType(events, "OBJECT_DETECTED"),
        tabSwitches: countEventsByType(events, "TAB_SWITCH"),
        riskScore: calculateRiskScore(
            buildRiskInput(events, sessionDurationMs),
        ).score,
    };
}

/**
 * Summarize flagged events into a compact natural language string.
 */
export function summarizeEvents(events: SessionEvent[]): string {
    const relevant = events.filter((e) =>
        ["GAZE_AWAY", "FACE_ABSENT", "OBJECT_DETECTED", "TAB_SWITCH"].includes(e.type),
    );

    if (relevant.length === 0) return "No critical events flagged.";

    const counts: Record<string, number> = {};
    relevant.forEach((e) => {
        counts[e.type] = (counts[e.type] || 0) + 1;
    });

    const summary = Object.entries(counts)
        .map(([type, count]) => `${count}x ${type.replace(/_/g, " ")}`)
        .join(", ");

    return `Summary: ${summary}. Total flagged: ${relevant.length}`;
}
