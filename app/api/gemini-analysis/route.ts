import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel, buildGeminiPrompt, validateGeminiResponse } from "@/lib/gemini";

/**
 * POST /api/gemini-analysis — Phase 5.2
 *
 * Validates incoming payload, calls Gemini, enforces strict JSON parsing.
 */
export async function POST(req: NextRequest) {
  try {
    // ── Parse request body ─────────────────────────────────────────────────
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }

    // ── Validate payload exists ────────────────────────────────────────────
    const data = body as { payload?: Record<string, unknown> };
    if (!data?.payload || typeof data.payload !== "object") {
      return NextResponse.json(
        { error: "Missing or invalid payload in request body." },
        { status: 400 },
      );
    }

    const p = data.payload;

    // ── Backend payload validation ─────────────────────────────────────────
    const durationSec = p["sessionDurationSec"];
    if (
      typeof durationSec !== "number" ||
      !Number.isFinite(durationSec) ||
      durationSec <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid session duration in payload." },
        { status: 400 },
      );
    }

    const riskScore = p["riskScore"];
    if (
      typeof riskScore !== "number" ||
      !Number.isFinite(riskScore) ||
      riskScore < 0 ||
      riskScore > 100
    ) {
      return NextResponse.json(
        { error: "Invalid risk score in payload." },
        { status: 400 },
      );
    }

    const focusRatio = p["focusRatio"];
    if (
      typeof focusRatio !== "number" ||
      !Number.isFinite(focusRatio) ||
      focusRatio < 0 ||
      focusRatio > 1
    ) {
      return NextResponse.json(
        { error: "Invalid focus ratio in payload." },
        { status: 400 },
      );
    }

    // ── Build prompt ───────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prompt = buildGeminiPrompt(data as any);

    // ── Call Gemini ────────────────────────────────────────────────────────
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Trim and strip any accidental markdown code fences
    const rawText = response
      .text()
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 },
      );
    }

    // ── Parse JSON ─────────────────────────────────────────────────────────
    let json: unknown;
    try {
      json = JSON.parse(rawText);
    } catch {
      console.error("[api/gemini] Non-JSON response from Gemini:", rawText.slice(0, 200));
      return NextResponse.json(
        { error: "AI returned an unreadable response. Please try again." },
        { status: 502 },
      );
    }

    // ── Validate schema ────────────────────────────────────────────────────
    const validated = validateGeminiResponse(json);
    return NextResponse.json(validated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate AI analysis.";
    console.error("[api/gemini] Unhandled error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
