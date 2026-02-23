/**
 * Unit tests for Phase 5 event transformation logic.
 *
 * Validates shape, severity, and metadata of coalesced events:
 * GAZE_AWAY, FACE_ABSENT, OBJECT_DETECTED, TAB_SWITCH.
 */

import { describe, it, expect } from "vitest";
import type { SessionEvent } from "@/store/sessionStore";

function createEventId(): string {
    return `${Date.now()}-test`;
}

function makeGazeAwayEvent(durationMs: number): SessionEvent {
    return {
        id: createEventId(),
        type: "GAZE_AWAY",
        timestamp: Date.now(),
        severity: "warning",
        metadata: { durationMs, gazeX: 0.5, gazeY: 0.1, maxDeviation: 0.52 },
    };
}

function makeFaceAbsentEvent(durationMs: number): SessionEvent {
    return {
        id: createEventId(),
        type: "FACE_ABSENT",
        timestamp: Date.now(),
        severity: "suspicious",
        metadata: { durationMs },
    };
}

function makeObjectDetectedEvent(label: string, score: number): SessionEvent {
    return {
        id: createEventId(),
        type: "OBJECT_DETECTED",
        timestamp: Date.now(),
        severity: "suspicious",
        metadata: { label, score, bbox: [10, 20, 100, 80] },
    };
}

function makeTabSwitchEvent(reason: string): SessionEvent {
    return {
        id: createEventId(),
        type: "TAB_SWITCH",
        timestamp: Date.now(),
        severity: "warning",
        metadata: { reason, visibilityState: "hidden" },
    };
}

function assertBaseShape(event: SessionEvent) {
    expect(typeof event.id).toBe("string");
    expect(event.id.length).toBeGreaterThan(0);
    expect(typeof event.type).toBe("string");
    expect(typeof event.timestamp).toBe("number");
    expect(["normal", "warning", "suspicious"]).toContain(event.severity);
}

describe("GAZE_AWAY event (coalesced)", () => {
    it("has base shape", () => assertBaseShape(makeGazeAwayEvent(3000)));
    it("has correct type and severity", () => {
        const e = makeGazeAwayEvent(2500);
        expect(e.type).toBe("GAZE_AWAY");
        expect(e.severity).toBe("warning");
    });
    it("stores sustained duration in metadata", () => {
        const e = makeGazeAwayEvent(4500);
        expect(e.metadata?.durationMs).toBe(4500);
        expect(e.metadata?.maxDeviation).toBe(0.52);
    });
});

describe("FACE_ABSENT event (coalesced)", () => {
    it("has base shape", () => assertBaseShape(makeFaceAbsentEvent(3000)));
    it("has correct type and severity", () => {
        const e = makeFaceAbsentEvent(2500);
        expect(e.type).toBe("FACE_ABSENT");
        expect(e.severity).toBe("suspicious");
    });
    it("stores duration in metadata", () => {
        const e = makeFaceAbsentEvent(5000);
        expect(e.metadata?.durationMs).toBe(5000);
    });
});

describe("OBJECT_DETECTED event", () => {
    it("has base shape", () => assertBaseShape(makeObjectDetectedEvent("cell phone", 0.87)));
    it("stores label and score", () => {
        const e = makeObjectDetectedEvent("laptop", 0.91);
        expect(e.metadata?.label).toBe("laptop");
        expect(e.metadata?.score).toBeCloseTo(0.91);
    });
    it("stores bbox", () => {
        const e = makeObjectDetectedEvent("cell phone", 0.8);
        expect(Array.isArray(e.metadata?.bbox)).toBe(true);
        expect((e.metadata?.bbox as number[]).length).toBe(4);
    });
});

describe("TAB_SWITCH event", () => {
    it("has base shape", () => assertBaseShape(makeTabSwitchEvent("blur")));
    it("has correct type", () => {
        expect(makeTabSwitchEvent("visibilitychange").type).toBe("TAB_SWITCH");
    });
    it("includes reason", () => {
        expect(makeTabSwitchEvent("blur").metadata?.reason).toBe("blur");
    });
});
