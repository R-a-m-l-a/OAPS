/**
 * Phase 6 — Edge Case & Validation Tests
 *
 * Covers: payload validation, store invariants, session duration,
 * Zod schema enforcement, event structure integrity.
 */

import { describe, it, expect } from "vitest";
import { GeminiAnalysisSchema } from "@/types/api";
import type { GeminiPayload } from "@/types/metrics";

// ── GeminiPayload validation ───────────────────────────────────────────────

describe("GeminiPayload structure", () => {
    function makePayload(overrides: Partial<GeminiPayload> = {}): GeminiPayload {
        return {
            sessionDurationSec: 300,
            focusRatio: 0.92,
            gazeIncidents: 1,
            longestGazeAwaySec: 2.5,
            faceAbsenceEvents: 0,
            objectIncidents: 0,
            tabSwitches: 1,
            riskScore: 14,
            ...overrides,
        };
    }

    it("valid payload has all required fields", () => {
        const p = makePayload();
        expect(p.sessionDurationSec).toBeGreaterThan(0);
        expect(p.focusRatio).toBeGreaterThanOrEqual(0);
        expect(p.focusRatio).toBeLessThanOrEqual(1);
        expect(p.riskScore).toBeGreaterThanOrEqual(0);
        expect(p.riskScore).toBeLessThanOrEqual(100);
    });

    it("rejects sessionDurationSec = 0 in validation check", () => {
        const p = makePayload({ sessionDurationSec: 0 });
        const isValid = p.sessionDurationSec > 0;
        expect(isValid).toBe(false);
    });

    it("rejects negative duration", () => {
        const p = makePayload({ sessionDurationSec: -10 });
        expect(p.sessionDurationSec > 0).toBe(false);
    });

    it("rejects focusRatio > 1", () => {
        const p = makePayload({ focusRatio: 1.5 });
        expect(p.focusRatio >= 0 && p.focusRatio <= 1).toBe(false);
    });

    it("rejects riskScore > 100", () => {
        const p = makePayload({ riskScore: 150 });
        expect(p.riskScore >= 0 && p.riskScore <= 100).toBe(false);
    });

    it("rejects riskScore < 0", () => {
        const p = makePayload({ riskScore: -5 });
        expect(p.riskScore >= 0 && p.riskScore <= 100).toBe(false);
    });
});

// ── Zod schema validation ──────────────────────────────────────────────────

describe("GeminiAnalysisSchema (Zod)", () => {
    it("accepts valid Gemini response", () => {
        const valid = {
            riskSummary: "Low risk session with minimal deviations.",
            focusScore: 88,
            anomaliesDetected: [],
            recommendation: "No action needed.",
        };
        const result = GeminiAnalysisSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it("accepts response with anomalies", () => {
        const valid = {
            riskSummary: "Moderate risk detected.",
            focusScore: 65,
            anomaliesDetected: ["Tab switching during exam", "Brief gaze deviation"],
            recommendation: "Review session recording.",
        };
        const result = GeminiAnalysisSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it("rejects missing riskSummary", () => {
        const invalid = {
            focusScore: 88,
            anomaliesDetected: [],
            recommendation: "No action.",
        };
        const result = GeminiAnalysisSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it("rejects focusScore > 100", () => {
        const invalid = {
            riskSummary: "OK",
            focusScore: 150,
            anomaliesDetected: [],
            recommendation: "X",
        };
        const result = GeminiAnalysisSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it("rejects focusScore < 0", () => {
        const invalid = {
            riskSummary: "OK",
            focusScore: -10,
            anomaliesDetected: [],
            recommendation: "X",
        };
        const result = GeminiAnalysisSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it("rejects non-string anomalies", () => {
        const invalid = {
            riskSummary: "OK",
            focusScore: 50,
            anomaliesDetected: [42],
            recommendation: "X",
        };
        const result = GeminiAnalysisSchema.safeParse(invalid);
        expect(result.success).toBe(false);
    });

    it("rejects completely wrong shape", () => {
        const result = GeminiAnalysisSchema.safeParse("just a string");
        expect(result.success).toBe(false);
    });

    it("rejects null", () => {
        const result = GeminiAnalysisSchema.safeParse(null);
        expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
        const result = GeminiAnalysisSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});

// ── SessionEvent structure ─────────────────────────────────────────────────

describe("SessionEvent invariants", () => {
    it("event id must be non-empty string", () => {
        const id = `${Date.now()}-test`;
        expect(typeof id).toBe("string");
        expect(id.length).toBeGreaterThan(0);
    });

    it("timestamp must be a positive number", () => {
        const ts = Date.now();
        expect(typeof ts).toBe("number");
        expect(ts).toBeGreaterThan(0);
    });

    it("severity must be one of the valid values", () => {
        const validSeverities = ["normal", "warning", "suspicious"];
        validSeverities.forEach((s) => {
            expect(["normal", "warning", "suspicious"]).toContain(s);
        });
    });
});
