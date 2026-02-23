import { z } from "zod";
import type { GeminiPayload, MetricsSummary } from "./metrics";

/**
 * Zod schema for the Gemini analysis response.
 */
export const GeminiAnalysisSchema = z.object({
    riskSummary: z
        .string()
        .describe("A concise 1-2 sentence summary of the session risk."),
    focusScore: z
        .number()
        .min(0)
        .max(100)
        .describe("A focus score based on eye tracking and tab switching."),
    anomaliesDetected: z
        .array(z.string())
        .describe("List of suspicious behaviors or objects found."),
    recommendation: z
        .string()
        .describe("Final verdict or recommendation for the proctor."),
});

export type GeminiAnalysisResponse = z.infer<typeof GeminiAnalysisSchema>;

/**
 * Request body for the Gemini analysis endpoint (Phase 5).
 * Uses the compressed GeminiPayload — no raw events.
 */
export type GeminiAnalysisRequest = {
    /** Compressed metrics for structured prompt generation. */
    payload: GeminiPayload;
    /** Legacy field — optional summarized text, kept for backward compat. */
    eventsSummary?: string;
    /** Full metrics for dashboard display. */
    metrics?: MetricsSummary;
};
