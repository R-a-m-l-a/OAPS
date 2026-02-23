"use client";

/**
 * useGeminiAnalysis — Phase 5.2
 *
 * Manages Gemini report generation state:
 * - Validates payload before calling the API (duration, riskScore, focusRatio)
 * - Prevents duplicate submissions while loading
 * - Handles loading, error, and success states
 */

import { useState, useCallback, useRef } from "react";
import type { GeminiAnalysisRequest, GeminiAnalysisResponse } from "@/types/api";

const MIN_SESSION_DURATION_SEC = 5;

export function useGeminiAnalysis() {
    const [report, setReport] = useState<GeminiAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prevent duplicate in-flight requests
    const isInFlightRef = useRef(false);

    const generateReport = useCallback(async (data: GeminiAnalysisRequest) => {
        // ── Duplicate submission guard ─────────────────────────────────────────
        if (isInFlightRef.current) return;

        // ── Payload validation (Phase 5.2 — PART 3) ───────────────────────────
        const p = data.payload;

        const durationSec = p.sessionDurationSec;
        if (
            typeof durationSec !== "number" ||
            !Number.isFinite(durationSec) ||
            durationSec <= 0
        ) {
            setError("Invalid session duration — cannot generate report.");
            return;
        }

        if (durationSec < MIN_SESSION_DURATION_SEC) {
            setError(`Session too short for analysis. (Minimum: ${MIN_SESSION_DURATION_SEC}s)`);
            return;
        }

        if (
            typeof p.riskScore !== "number" ||
            !Number.isFinite(p.riskScore) ||
            p.riskScore < 0 ||
            p.riskScore > 100
        ) {
            setError("Invalid risk score — cannot generate report.");
            return;
        }

        if (
            typeof p.focusRatio !== "number" ||
            !Number.isFinite(p.focusRatio) ||
            p.focusRatio < 0 ||
            p.focusRatio > 1
        ) {
            setError("Invalid focus ratio — cannot generate report.");
            return;
        }

        // ── Execute API call ───────────────────────────────────────────────────
        isInFlightRef.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/gemini-analysis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let errMessage = "Failed to generate report.";
                try {
                    const errData = await response.json();
                    errMessage = errData.error || errMessage;
                } catch {
                    // response body wasn't valid JSON — use default message
                }
                throw new Error(errMessage);
            }

            const result = await response.json();
            setReport(result);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "An unexpected error occurred.";
            console.error("[useGeminiAnalysis] Error:", message);
            setError(message);
        } finally {
            setIsLoading(false);
            isInFlightRef.current = false;
        }
    }, []);

    const resetReport = useCallback(() => {
        setReport(null);
        setError(null);
        setIsLoading(false);
        isInFlightRef.current = false;
    }, []);

    return {
        report,
        isLoading,
        error,
        generateReport,
        resetReport,
    };
}
