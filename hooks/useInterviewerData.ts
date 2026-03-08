"use client";

/**
 * Polls the server-side session store for the interviewer dashboard.
 * Returns events, risk score, and session status.
 */

import { useEffect, useState } from "react";
import type { SessionEvent } from "@/store/sessionStore";

const POLL_INTERVAL_MS = 1000;

export type InterviewerSessionData = {
  events: SessionEvent[];
  riskScore: number;
  focusRatio: number;
  isSessionActive: boolean;
  sessionStartTime: number | null;
  sessionEndTime: number | null;
};

const initial: InterviewerSessionData = {
  events: [],
  riskScore: 0,
  focusRatio: 1,
  isSessionActive: false,
  sessionStartTime: null,
  sessionEndTime: null,
};

export function useInterviewerData(): InterviewerSessionData {
  const [data, setData] = useState<InterviewerSessionData>(initial);

  useEffect(() => {
    const fetchData = () => {
      fetch("/api/session/events", { credentials: "include" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((body) => {
          if (Array.isArray(body.events)) {
            const newData = {
              events: body.events,
              riskScore: typeof body.riskScore === "number" ? body.riskScore : 0,
              focusRatio:
                typeof body.focusRatio === "number" && body.focusRatio >= 0 && body.focusRatio <= 1
                  ? body.focusRatio
                  : 1,
              isSessionActive: Boolean(body.isSessionActive),
              sessionStartTime:
                typeof body.sessionStartTime === "number" ? body.sessionStartTime : null,
              sessionEndTime:
                typeof body.sessionEndTime === "number" ? body.sessionEndTime : null,
            };
            console.log(
              `[useInterviewerData] Received: ${newData.events.length} events, ` +
              `risk=${newData.riskScore}, active=${newData.isSessionActive}`
            );
            setData(newData);
          }
        })
        .catch((err) => {
          console.error("[useInterviewerData] Failed to fetch:", err);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return data;
}
