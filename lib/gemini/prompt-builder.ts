import type { GeminiAnalysisRequest } from "@/types/api";

/**
 * Builds the Gemini prompt from the compressed payload.
 * Phase 5.2 — concise, behavior-focused, professional tone.
 *
 * Strict rules enforced in prompt:
 * - Under 180 words total
 * - No system error commentary
 * - No data validity speculation
 * - 3 output sections only
 */
export function buildGeminiPrompt(data: GeminiAnalysisRequest): string {
  const p = data.payload;

  const focusPct = (p.focusRatio * 100).toFixed(1);
  const riskLabel =
    p.riskScore >= 70 ? "High" : p.riskScore >= 35 ? "Medium" : "Low";

  return `You are an AI interview session analyzer. Generate a concise professional behavioral report.

STRICT RULES:
- Total response must be under 180 words.
- Do NOT mention system errors, data issues, or technical inconsistencies.
- Do NOT restate the raw numbers unless essential for clarity.
- Interpret behavior logically and professionally.
- Tone: neutral, professional, concise.

SESSION DATA:
- Duration: ${p.sessionDurationSec}s
- Focus Ratio: ${focusPct}%
- Gaze Away Incidents: ${p.gazeIncidents}
- Longest Gaze Away: ${p.longestGazeAwaySec}s
- Face Absence Events: ${p.faceAbsenceEvents}
- Prohibited Object Detections: ${p.objectIncidents}
- Tab Switches: ${p.tabSwitches}
- Risk Score: ${p.riskScore}/100 (${riskLabel})

Return ONLY a valid JSON object. No markdown, no code fences, no extra text.

{
  "riskSummary": "1-2 sentence overall risk assessment.",
  "focusScore": <integer 0-100 representing candidate focus>,
  "anomaliesDetected": ["concise anomaly description", ...],
  "recommendation": "1 sentence action for the proctor."
}`;
}
