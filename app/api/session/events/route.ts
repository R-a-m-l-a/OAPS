import { NextRequest, NextResponse } from "next/server";
import { getSession, addEvents, updateSession } from "@/lib/session/memory-store";

function isValidEvent(e: unknown): e is { id: string; type: string; timestamp: number; severity: "normal" | "warning" | "suspicious"; metadata?: Record<string, unknown> } {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.type === "string" &&
    typeof o.timestamp === "number" &&
    ["normal", "warning", "suspicious"].includes(String(o.severity))
  );
}

/**
 * POST — Interviewee pushes batched events and optional risk score.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }
    const data = body as {
      events?: unknown[];
      riskScore?: number;
      focusRatio?: number;
    };
    if (Array.isArray(data.events) && data.events.length > 0) {
      const valid = data.events.filter(isValidEvent);
      if (valid.length > 0) {
        addEvents(valid);
      }
    }
    if (
      typeof data.riskScore === "number" &&
      Number.isFinite(data.riskScore) &&
      data.riskScore >= 0 &&
      data.riskScore <= 100
    ) {
      updateSession({ riskScore: Math.round(data.riskScore) });
    }
    if (
      typeof data.focusRatio === "number" &&
      Number.isFinite(data.focusRatio) &&
      data.focusRatio >= 0 &&
      data.focusRatio <= 1
    ) {
      updateSession({ focusRatio: data.focusRatio });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/session/events POST]", err);
    return NextResponse.json(
      { error: "Failed to update session." },
      { status: 500 }
    );
  }
}

/**
 * GET — Interviewer polls for current events and risk score.
 */
export async function GET() {
  try {
    const session = getSession();
    return NextResponse.json({
      events: session.events,
      riskScore: session.riskScore,
      focusRatio: session.focusRatio,
      isSessionActive: session.isSessionActive,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: session.sessionEndTime,
    });
  } catch (err) {
    console.error("[api/session/events GET]", err);
    return NextResponse.json(
      { error: "Failed to get session." },
      { status: 500 }
    );
  }
}
