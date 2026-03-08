"use client";

/**
 * Syncs local Zustand session state to the server-side in-memory store
 * so the interviewer dashboard can read it. Used only on the interviewee page.
 * Call pushStatus("start" | "end" | "reset") when the user starts/ends/resets the session.
 */

import { useCallback, useEffect, useRef } from "react";
import { useSessionStore } from "@/store/sessionStore";

const SYNC_INTERVAL_MS = 500;

export function useSessionSync(focusRatio: number = 1) {
  const events = useSessionStore((s) => s.events);
  const riskScore = useSessionStore((s) => s.riskScore);
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const lastSyncedEventCount = useRef(0);

  const pushStatus = useCallback((action: "start" | "end" | "reset") => {
    console.log("[useSessionSync] Pushing status:", action);
    fetch("/api/session/status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      credentials: "include",
    })
      .then(() => console.log("[useSessionSync] Status pushed:", action))
      .catch((err) => {
        console.error("[useSessionSync] Failed to push status:", err);
      });
  }, []);

  useEffect(() => {
    if (!isSessionActive && events.length === 0) {
      lastSyncedEventCount.current = 0;
      return;
    }

    const syncNow = () => {
      const toSend = events.slice(lastSyncedEventCount.current);
      const hasNewEvents = toSend.length > 0;
      lastSyncedEventCount.current = events.length;
      
      if (hasNewEvents || isSessionActive) {
        console.log(`[useSessionSync] Syncing: ${toSend.length} events, risk=${riskScore}`);
        fetch("/api/session/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            events: toSend,
            riskScore,
            focusRatio: Number.isFinite(focusRatio) ? focusRatio : 1,
          }),
          credentials: "include",
        })
          .then(() => {
            if (hasNewEvents) {
              console.log(`[useSessionSync] Synced ${toSend.length} events successfully`);
            }
          })
          .catch((err) => {
            console.error("[useSessionSync] Failed to sync:", err);
          });
      }
    };

    syncNow();
    const interval = setInterval(syncNow, SYNC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [events, riskScore, focusRatio, isSessionActive]);

  return { pushStatus };
}
