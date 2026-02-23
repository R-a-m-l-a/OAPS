/**
 * Phase 6 — Risk Calculator Tests (comprehensive)
 *
 * Covers: zero input, individual weights, cap enforcement, combined caps,
 * overflow prevention, boundary thresholds, negative rejection, determinism.
 */

import { describe, it, expect } from "vitest";
import { calculateRiskScore } from "@/lib/utils/risk-calculator";
import type { RiskInput } from "@/types/metrics";

function make(
    gaze = 0, absence = 0, objects = 0, tabs = 0, dur = 60000,
): RiskInput {
    return {
        gazeDeviationCount: gaze,
        faceAbsenceCount: absence,
        objectDetectionCount: objects,
        tabSwitchCount: tabs,
        sessionDurationMs: dur,
    };
}

describe("calculateRiskScore — saturated model", () => {
    // ── Zero / baseline ──────────────────────────────────────────────────────
    it("returns 0/Low for zero input", () => {
        const { score, level } = calculateRiskScore(make());
        expect(score).toBe(0);
        expect(level).toBe("Low");
    });

    // ── Individual weights ───────────────────────────────────────────────────
    it("gaze: weight 8 per incident", () => {
        expect(calculateRiskScore(make(1)).score).toBe(8);
        expect(calculateRiskScore(make(3)).score).toBe(24);
    });

    it("absence: weight 15 per incident", () => {
        expect(calculateRiskScore(make(0, 1)).score).toBe(15);
        expect(calculateRiskScore(make(0, 2)).score).toBe(30);
    });

    it("object: weight 20 per incident", () => {
        expect(calculateRiskScore(make(0, 0, 1)).score).toBe(20);
        expect(calculateRiskScore(make(0, 0, 2)).score).toBe(40);
    });

    it("tab: weight 6 per incident", () => {
        expect(calculateRiskScore(make(0, 0, 0, 1)).score).toBe(6);
        expect(calculateRiskScore(make(0, 0, 0, 3)).score).toBe(18);
    });

    // ── Cap enforcement ──────────────────────────────────────────────────────
    it("gaze capped at 5 → max 40", () => {
        expect(calculateRiskScore(make(5)).score).toBe(40);
        expect(calculateRiskScore(make(10)).score).toBe(40);
        expect(calculateRiskScore(make(100)).score).toBe(40);
    });

    it("absence capped at 3 → max 45", () => {
        expect(calculateRiskScore(make(0, 3)).score).toBe(45);
        expect(calculateRiskScore(make(0, 10)).score).toBe(45);
    });

    it("object capped at 3 → max 60", () => {
        expect(calculateRiskScore(make(0, 0, 3)).score).toBe(60);
        expect(calculateRiskScore(make(0, 0, 10)).score).toBe(60);
    });

    it("tab capped at 5 → max 30", () => {
        expect(calculateRiskScore(make(0, 0, 0, 5)).score).toBe(30);
        expect(calculateRiskScore(make(0, 0, 0, 20)).score).toBe(30);
    });

    // ── Combined overflow → clamp at 100 ─────────────────────────────────────
    it("all maxed: 40+45+60+30=175 → clamped to 100", () => {
        expect(calculateRiskScore(make(100, 100, 100, 100)).score).toBe(100);
    });

    // ── Never negative ───────────────────────────────────────────────────────
    it("score is always ≥ 0 even with zero input", () => {
        expect(calculateRiskScore(make()).score).toBeGreaterThanOrEqual(0);
        expect(calculateRiskScore(make(0, 0, 0, 0, 0)).score).toBeGreaterThanOrEqual(0);
    });

    // ── Level thresholds ─────────────────────────────────────────────────────
    it("Low < 35", () => {
        expect(calculateRiskScore(make(4)).level).toBe("Low");   // 32
        expect(calculateRiskScore(make(0, 0, 0, 5)).level).toBe("Low"); // 30
    });

    it("Medium at 35–69", () => {
        expect(calculateRiskScore(make(5)).level).toBe("Medium"); // 40
        expect(calculateRiskScore(make(0, 0, 0, 5, 60000)).level).toBe("Low"); // 30 → Low
        expect(calculateRiskScore(make(0, 0, 2)).level).toBe("Medium"); // 40
    });

    it("High at ≥ 70", () => {
        expect(calculateRiskScore(make(5, 2)).level).toBe("High"); // 40+30=70
        expect(calculateRiskScore(make(0, 0, 3, 2)).level).toBe("High"); // 60+12=72
    });

    // ── Realistic scenarios ──────────────────────────────────────────────────
    it("normal candidate: 1 gaze + 0 absence + 0 objects + 1 tab → Low", () => {
        const { score, level } = calculateRiskScore(make(1, 0, 0, 1));
        expect(score).toBe(14); // 8+6
        expect(level).toBe("Low");
    });

    it("moderate session: 2 gaze + 1 absence + 0 objects + 2 tabs → Medium", () => {
        const { score, level } = calculateRiskScore(make(2, 1, 0, 2));
        expect(score).toBe(43); // 16+15+12
        expect(level).toBe("Medium");
    });

    // ── Determinism ──────────────────────────────────────────────────────────
    it("same input → same output", () => {
        const a = calculateRiskScore(make(3, 1, 2, 4));
        const b = calculateRiskScore(make(3, 1, 2, 4));
        expect(a.score).toBe(b.score);
        expect(a.level).toBe(b.level);
    });

    // ── Score is always integer ──────────────────────────────────────────────
    it("score is always a whole number", () => {
        for (let i = 0; i < 10; i++) {
            const { score } = calculateRiskScore(make(i, i % 4, i % 3, i));
            expect(Number.isInteger(score)).toBe(true);
        }
    });

    // ── Score always in [0, 100] ─────────────────────────────────────────────
    it("score is always in [0, 100] range", () => {
        const extreme = calculateRiskScore(make(999, 999, 999, 999));
        expect(extreme.score).toBeLessThanOrEqual(100);
        expect(extreme.score).toBeGreaterThanOrEqual(0);
    });
});
