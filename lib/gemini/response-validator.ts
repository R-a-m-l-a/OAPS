import { GeminiAnalysisSchema, GeminiAnalysisResponse } from "@/types/api";

/**
 * Validates a raw response from Gemini against the Zod schema.
 * Throws an error if validation fails.
 */
export function validateGeminiResponse(data: unknown): GeminiAnalysisResponse {
    try {
        return GeminiAnalysisSchema.parse(data);
    } catch (err) {
        console.error("[gemini-validator] Validation failed:", err);
        throw new Error("Invalid AI analysis format received.");
    }
}
