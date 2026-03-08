import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  updateSession,
  clearSession,
} from "@/lib/session/memory-store";

/**
 * PUT — Interviewee updates session status (start / end / reset).
 */
export async function PUT(req: NextRequest) {
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
    const data = body as { action?: string };
    const action = String(data.action ?? "").toLowerCase();
    const now = Date.now();

    if (action === "start") {
      updateSession({
        isSessionActive: true,
        sessionStartTime: now,
        sessionEndTime: null,
        events: [],
        riskScore: 0,
        focusRatio: 1,
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "end") {
      updateSession({
        isSessionActive: false,
        sessionEndTime: now,
      });
      return NextResponse.json({ ok: true });
    }
    if (action === "reset") {
      clearSession();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Invalid action. Use start, end, or reset." },
      { status: 400 }
    );
  } catch (err) {
    console.error("[api/session/status PUT]", err);
    return NextResponse.json(
      { error: "Failed to update status." },
      { status: 500 }
    );
  }
}

/**
 * GET — Interviewer reads session status.
 */
export async function GET() {
  try {
    const session = getSession();
    return NextResponse.json({
      isSessionActive: session.isSessionActive,
      sessionStartTime: session.sessionStartTime,
      sessionEndTime: session.sessionEndTime,
    });
  } catch (err) {
    console.error("[api/session/status GET]", err);
    return NextResponse.json(
      { error: "Failed to get status." },
      { status: 500 }
    );
  }
}
