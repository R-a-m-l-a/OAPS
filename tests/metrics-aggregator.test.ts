/**
 * Phase 6 — Metrics Aggregator Tests (comprehensive)
 *
 * Covers: countEventsByType, longestDuration, buildRiskInput,
 * aggregateMetrics (focusRatio, duration, riskScore), buildGeminiPayload.
 */

import { describe, it, expect } from "vitest";
import {
    countEventsByType,
    buildRiskInput,
    aggregateMetrics,
    longestDuration,
    buildGeminiPayload,
} from "@/lib/utils/metrics-aggregator";
import type { SessionEvent } from "@/store/sessionStore";

function makeEvent(
    type: string,
    severity: SessionEvent["severity"] = "normal",
    metadata?: Record<string, unknown>,
): SessionEvent {
    return {
        id: `${Date.now()}-${Math.random()}`,
        type,
        timestamp: Date.now(),
        severity,
        metadata,
    };
}

// ── countEventsByType ──────────────────────────────────────────────────────

describe("countEventsByType", () => {
    it("returns 0 for empty array", () => {
        expect(countEventsByType([], "GAZE_AWAY")).toBe(0);
    });

    it("counts matching type only", () => {
        const events = [
            makeEvent("GAZE_AWAY"),
            makeEvent("GAZE_AWAY"),
            makeEvent("TAB_SWITCH"),
        ];
        expect(countEventsByType(events, "GAZE_AWAY")).toBe(2);
        expect(countEventsByType(events, "TAB_SWITCH")).toBe(1);
        expect(countEventsByType(events, "FACE_ABSENT")).toBe(0);
    });

    it("returns 0 for non-existent type", () => {
        const events = [makeEvent("GAZE_AWAY")];
        expect(countEventsByType(events, "UNKNOWN")).toBe(0);
    });
});

// ── longestDuration ────────────────────────────────────────────────────────

describe("longestDuration", () => {
    it("returns 0 for empty events", () => {
        expect(longestDuration([], "GAZE_AWAY")).toBe(0);
    });

    it("returns 0 when no events have durationMs metadata", () => {
        const events = [makeEvent("GAZE_AWAY", "warning")];
        expect(longestDuration(events, "GAZE_AWAY")).toBe(0);
    });

    it("finds the longest duration", () => {
        const events = [
            makeEvent("GAZE_AWAY", "warning", { durationMs: 3000 }),
            makeEvent("GAZE_AWAY", "warning", { durationMs: 5000 }),
            makeEvent("GAZE_AWAY", "warning", { durationMs: 2500 }),
        ];
        expect(longestDuration(events, "GAZE_AWAY")).toBe(5000);
    });

    it("ignores events of wrong type", () => {
        const events = [
            makeEvent("GAZE_AWAY", "warning", { durationMs: 3000 }),
            makeEvent("TAB_SWITCH", "warning", { durationMs: 99000 }),
        ];
        expect(longestDuration(events, "GAZE_AWAY")).toBe(3000);
    });
});

// ── buildRiskInput ─────────────────────────────────────────────────────────

describe("buildRiskInput", () => {
    it("returns zero counts for empty events", () => {
        const input = buildRiskInput([], 60000);
        expect(input.gazeDeviationCount).toBe(0);
        expect(input.faceAbsenceCount).toBe(0);
        expect(input.objectDetectionCount).toBe(0);
        expect(input.tabSwitchCount).toBe(0);
        expect(input.sessionDurationMs).toBe(60000);
    });

    it("maps all event types correctly", () => {
        const events = [
            makeEvent("GAZE_AWAY", "warning"),
            makeEvent("GAZE_AWAY", "warning"),
            makeEvent("FACE_ABSENT", "suspicious"),
            makeEvent("OBJECT_DETECTED", "suspicious"),
            makeEvent("OBJECT_DETECTED", "suspicious"),
            makeEvent("OBJECT_DETECTED", "suspicious"),
            makeEvent("TAB_SWITCH", "warning"),
        ];
        const input = buildRiskInput(events, 120000);
        expect(input.gazeDeviationCount).toBe(2);
        expect(input.faceAbsenceCount).toBe(1);
        expect(input.objectDetectionCount).toBe(3);
        expect(input.tabSwitchCount).toBe(1);
    });
});

// ── aggregateMetrics ───────────────────────────────────────────────────────

describe("aggregateMetrics", () => {
    it("returns defaults for empty events", () => {
        const summary = aggregateMetrics([], 60000, 1);
        expect(summary.gazeDeviationCount).toBe(0);
        expect(summary.faceAbsenceCount).toBe(0);
        expect(summary.objectDetectionCount).toBe(0);
        expect(summary.tabSwitchCount).toBe(0);
        expect(summary.riskScore).toBe(0);
        expect(summary.riskLevel).toBe("Low");
        expect(summary.focusRatio).toBe(1);
        expect(summary.longestGazeAwayMs).toBe(0);
        expect(summary.sessionDurationMs).toBe(60000);
    });

    it("carries focusRatio through", () => {
        const summary = aggregateMetrics([], 60000, 0.85);
        expect(summary.focusRatio).toBe(0.85);
    });

    it("computes longestGazeAwayMs from events", () => {
        const events = [
            makeEvent("GAZE_AWAY", "warning", { durationMs: 4000 }),
            makeEvent("GAZE_AWAY", "warning", { durationMs: 2000 }),
        ];
        const summary = aggregateMetrics(events, 60000, 0.9);
        expect(summary.longestGazeAwayMs).toBe(4000);
    });

    it("focusRatio ∈ [0, 1]", () => {
        const s1 = aggregateMetrics([], 60000, 0);
        const s2 = aggregateMetrics([], 60000, 1);
        expect(s1.focusRatio).toBeGreaterThanOrEqual(0);
        expect(s2.focusRatio).toBeLessThanOrEqual(1);
    });

    it("sessionDurationMs is always positive", () => {
        const summary = aggregateMetrics([], 1, 1);
        expect(summary.sessionDurationMs).toBeGreaterThan(0);
    });
});

// ── buildGeminiPayload ─────────────────────────────────────────────────────

describe("buildGeminiPayload", () => {
    it("produces correct structure", () => {
        const events = [
            makeEvent("GAZE_AWAY", "warning", { durationMs: 3000 }),
            makeEvent("FACE_ABSENT", "suspicious", { durationMs: 2500 }),
            makeEvent("TAB_SWITCH", "warning"),
        ];
        const payload = buildGeminiPayload(events, 120000, 0.88);

        expect(payload.sessionDurationSec).toBe(120);
        expect(payload.focusRatio).toBe(0.88);
        expect(payload.gazeIncidents).toBe(1);
        expect(payload.longestGazeAwaySec).toBe(3);
        expect(payload.faceAbsenceEvents).toBe(1);
        expect(payload.objectIncidents).toBe(0);
        expect(payload.tabSwitches).toBe(1);
        expect(payload.riskScore).toBeGreaterThanOrEqual(0);
        expect(payload.riskScore).toBeLessThanOrEqual(100);
    });

    it("sessionDurationSec is never 0 for valid input", () => {
        const payload = buildGeminiPayload([], 60000, 1);
        expect(payload.sessionDurationSec).toBe(60);
    });

    it("handles empty events gracefully", () => {
        const payload = buildGeminiPayload([], 300000, 1);
        expect(payload.gazeIncidents).toBe(0);
        expect(payload.faceAbsenceEvents).toBe(0);
        expect(payload.objectIncidents).toBe(0);
        expect(payload.tabSwitches).toBe(0);
        expect(payload.riskScore).toBe(0);
    });

    it("focusRatio rounds to 2 decimal places", () => {
        const payload = buildGeminiPayload([], 60000, 0.8765);
        expect(payload.focusRatio).toBe(0.88);
    });
});
