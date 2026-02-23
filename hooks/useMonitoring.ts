"use client";

/**
 * useMonitoring — Phase 5: State-Machine-Based Detection
 *
 * Central monitoring orchestrator with:
 *   - Gaze state machine (NORMAL → MONITORING_DEVIATION → ALERT_ACTIVE)
 *   - Face absence detection (separate from gaze)
 *   - Object detection with per-label cooldown
 *   - Tab-switch coalesced logging
 *   - Time-quality tracking (focusedTime, deviationTime, absenceTime)
 *   - Saturated risk scoring (no infinite growth)
 *   - Single RAF loop for ALL AI inference (no duplicate loops)
 *   - Full cleanup on session end (models, timers, state)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { SessionEvent } from "@/store/sessionStore";
import { useSessionStore } from "@/store/sessionStore";
import { useWebcam } from "@/hooks/useWebcam";
import {
  loadGazeModel,
  runGazeInference,
  disposeGazeModel,
  isGazeModelReady,
  loadObjectModel,
  runObjectDetection,
  disposeObjectModel,
  isObjectModelReady,
} from "@/lib/ai";
import { buildRiskInput } from "@/lib/utils/metrics-aggregator";
import { calculateRiskScore } from "@/lib/utils/risk-calculator";
import {
  INFERENCE_INTERVAL_MS,
  STRONG_DEVIATION,
  SLIGHT_DEVIATION,
  SUSTAIN_DURATION_MS,
  GAZE_COOLDOWN_MS,
  MIN_FACE_CONFIDENCE,
  FACE_ABSENCE_SUSTAIN_MS,
  FACE_ABSENCE_COOLDOWN_MS,
  OBJECT_DETECTION_COOLDOWN_MS,
  CENTERED_SUSTAIN_DURATION_MS,
} from "@/lib/utils/constants";
import type {
  GazeResult,
  GazeState,
  ObjectDetectionResult,
  TimeQualityMetrics,
} from "@/types/metrics";

// ─── Types ───────────────────────────────────────────────────────────────────

export type MonitoringStatus = "idle" | "starting" | "active" | "stopped";
export type AIModelStatus = "idle" | "loading" | "ready" | "error";

export type UseMonitoringResult = {
  status: MonitoringStatus;
  elapsedMs: number;
  elapsedLabel: string;
  webcam: ReturnType<typeof useWebcam>;
  aiStatus: AIModelStatus;
  lastGazeResult: GazeResult | null;
  lastObjectResult: ObjectDetectionResult | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  gazeState: GazeState;
  timeQuality: TimeQualityMetrics;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`;
}

function createEventId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const INITIAL_TIME_QUALITY: TimeQualityMetrics = {
  focusedTimeMs: 0,
  minorMovementTimeMs: 0,
  deviationTimeMs: 0,
  absenceTimeMs: 0,
  totalSessionTimeMs: 0,
  focusRatio: 1,
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMonitoring(): UseMonitoringResult {
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const sessionStartTime = useSessionStore((s) => s.sessionStartTime);
  const events = useSessionStore((s) => s.events);
  const addEvent = useSessionStore((s) => s.addEvent);
  const setRiskScore = useSessionStore((s) => s.setRiskScore);

  const webcam = useWebcam();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [status, setStatus] = useState<MonitoringStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [aiStatus, setAiStatus] = useState<AIModelStatus>("idle");
  const [lastGazeResult, setLastGazeResult] = useState<GazeResult | null>(null);
  const [lastObjectResult, setLastObjectResult] =
    useState<ObjectDetectionResult | null>(null);
  const [gazeState, setGazeState] = useState<GazeState>("NORMAL");
  const [timeQuality, setTimeQuality] =
    useState<TimeQualityMetrics>(INITIAL_TIME_QUALITY);

  // Stable refs
  const isSessionActiveRef = useRef(isSessionActive);
  const addEventRef = useRef(addEvent);

  useEffect(() => { isSessionActiveRef.current = isSessionActive; }, [isSessionActive]);
  useEffect(() => { addEventRef.current = addEvent; }, [addEvent]);

  // ▸▸ State machine refs (kept in refs so the single RAF loop stays stable) ──
  const gazeStateRef = useRef<GazeState>("NORMAL");
  const deviationStartRef = useRef<number | null>(null);
  const lastGazeAlertTimeRef = useRef(0);

  const absenceStartRef = useRef<number | null>(null);
  const lastFaceAbsentTimeRef = useRef(0);
  const isFaceAbsentLoggedRef = useRef(false);

  const objectCooldownMap = useRef<Map<string, number>>(new Map());

  // Time-quality tracking refs
  const lastFrameTimeRef = useRef<number>(Date.now());
  const tqFocusedRef = useRef(0);
  const tqMinorRef = useRef(0);
  const tqDeviationRef = useRef(0);
  const tqAbsenceRef = useRef(0);
  const longestGazeAwayRef = useRef(0);

  // ── Session timer loop ────────────────────────────────────────────────────
  const timerRafRef = useRef<number | null>(null);
  const lastTimerTickRef = useRef<number>(0);

  useEffect(() => {
    if (!isSessionActive || !sessionStartTime) {
      if (timerRafRef.current) {
        cancelAnimationFrame(timerRafRef.current);
        timerRafRef.current = null;
      }
      setElapsedMs(0);
      return;
    }

    lastTimerTickRef.current = 0;

    const loop = (now: number) => {
      if (now - lastTimerTickRef.current >= 250) {
        setElapsedMs(Date.now() - sessionStartTime);
        lastTimerTickRef.current = now;
      }
      timerRafRef.current = requestAnimationFrame(loop);
    };

    timerRafRef.current = requestAnimationFrame(loop);

    return () => {
      if (timerRafRef.current) {
        cancelAnimationFrame(timerRafRef.current);
        timerRafRef.current = null;
      }
    };
  }, [isSessionActive, sessionStartTime]);

  // ── Webcam lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSessionActive) {
      webcam.stop();
      setStatus("stopped");
      return;
    }

    let isCancelled = false;
    const start = async () => {
      setStatus("starting");
      await webcam.requestAccess();
      if (isCancelled) return;
      setStatus(webcam.status === "ready" ? "active" : "starting");
    };
    start();
    return () => { isCancelled = true; };
  }, [isSessionActive, webcam.requestAccess, webcam.stop, webcam.status]);

  // ── Tab-switch detection ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isSessionActive) return;

    let lastLoggedAt = 0;
    const COALESCE_WINDOW_MS = 800;

    const logTabSwitch = (reason: "visibilitychange" | "blur") => {
      const now = Date.now();
      if (now - lastLoggedAt < COALESCE_WINDOW_MS) return;
      lastLoggedAt = now;

      addEvent({
        id: createEventId(),
        type: "TAB_SWITCH",
        timestamp: now,
        severity: "warning",
        metadata: { reason, visibilityState: document.visibilityState },
      });
    };

    const onVis = () => {
      if (document.visibilityState !== "visible") logTabSwitch("visibilitychange");
    };
    const onBlur = () => logTabSwitch("blur");

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
    };
  }, [isSessionActive, addEvent]);

  // ── AI model loading ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSessionActive) return;
    let isCancelled = false;
    const load = async () => {
      setAiStatus("loading");
      try {
        await Promise.all([loadGazeModel(), loadObjectModel()]);
        if (!isCancelled) setAiStatus("ready");
      } catch (err) {
        console.error("[useMonitoring] AI model load failed:", err);
        if (!isCancelled) setAiStatus("error");
      }
    };
    load();
    return () => { isCancelled = true; };
  }, [isSessionActive]);

  // ── AI model dispose + full state reset on session end ────────────────────
  useEffect(() => {
    if (isSessionActive) return;

    disposeGazeModel();
    disposeObjectModel();
    setLastGazeResult(null);
    setLastObjectResult(null);
    setAiStatus("idle");
    setGazeState("NORMAL");
    setTimeQuality(INITIAL_TIME_QUALITY);

    // Reset all state machine refs
    gazeStateRef.current = "NORMAL";
    deviationStartRef.current = null;
    lastGazeAlertTimeRef.current = 0;
    absenceStartRef.current = null;
    lastFaceAbsentTimeRef.current = 0;
    isFaceAbsentLoggedRef.current = false;
    objectCooldownMap.current.clear();
    lastFrameTimeRef.current = Date.now();
    tqFocusedRef.current = 0;
    tqMinorRef.current = 0;
    tqDeviationRef.current = 0;
    tqAbsenceRef.current = 0;
    longestGazeAwayRef.current = 0;
  }, [isSessionActive]);

  // ── SINGLE unified AI inference loop (Phase 5 — no duplicate loops!) ──────
  const aiRafRef = useRef<number | null>(null);
  const lastGazeInferenceRef = useRef<number>(0);
  const lastObjInferenceRef = useRef<number>(0);

  const aiLoop = useCallback(
    async (now: number) => {
      if (!isSessionActiveRef.current) return;

      const addEvt = addEventRef.current;
      const video = videoRef.current;

      // ── Time-quality delta tracking ─────────────────────────────────────
      const frameNow = Date.now();
      const deltaMs = frameNow - lastFrameTimeRef.current;
      lastFrameTimeRef.current = frameNow;

      // ── GAZE inference (throttled to INFERENCE_INTERVAL_MS) ─────────────
      if (now - lastGazeInferenceRef.current >= INFERENCE_INTERVAL_MS) {
        lastGazeInferenceRef.current = now;

        if (video && isGazeModelReady()) {
          const result = await runGazeInference(video);

          if (result) {
            // ─── FACE ABSENCE STATE (separate from gaze) ──────────────
            if (
              !result.faceDetected ||
              result.faceDetectionConfidence < MIN_FACE_CONFIDENCE
            ) {
              // Face not present
              if (!absenceStartRef.current) {
                absenceStartRef.current = frameNow;
              }

              const absenceDuration = frameNow - absenceStartRef.current;

              if (
                absenceDuration >= FACE_ABSENCE_SUSTAIN_MS &&
                !isFaceAbsentLoggedRef.current &&
                frameNow - lastFaceAbsentTimeRef.current >= FACE_ABSENCE_COOLDOWN_MS
              ) {
                isFaceAbsentLoggedRef.current = true;
                lastFaceAbsentTimeRef.current = frameNow;
                addEvt({
                  id: createEventId(),
                  type: "FACE_ABSENT",
                  timestamp: frameNow,
                  severity: "suspicious",
                  metadata: { durationMs: absenceDuration },
                });
              }

              // Track absence time
              tqAbsenceRef.current += deltaMs;

              // Update gaze state
              gazeStateRef.current = "ABSENT";
              setGazeState("ABSENT");
            } else {
              // Face IS present — reset absence tracking
              absenceStartRef.current = null;
              isFaceAbsentLoggedRef.current = false;

              // ─── GAZE STATE MACHINE (Phase 5.1 angle-based gating) ─────

              // Gate 1: Safe Zone → ALWAYS NORMAL, reset timer
              if (result.inSafeZone) {
                gazeStateRef.current = "NORMAL";
                deviationStartRef.current = null;
                tqFocusedRef.current += deltaMs;
              }
              // Gate 2: Not strong deviation → minor movement, ignore
              else if (!result.isStrongDeviation) {
                gazeStateRef.current = "NORMAL";
                deviationStartRef.current = null;
                tqMinorRef.current += deltaMs;
              }
              // Gate 3: STRONG deviation — enter state machine
              else {
                if (gazeStateRef.current === "NORMAL") {
                  gazeStateRef.current = "MONITORING_DEVIATION";
                  deviationStartRef.current = frameNow;
                }

                if (gazeStateRef.current === "MONITORING_DEVIATION") {
                  const sustained = frameNow - (deviationStartRef.current ?? frameNow);

                  // Centered faces get a longer sustain requirement
                  const requiredSustain = result.isCentered
                    ? CENTERED_SUSTAIN_DURATION_MS
                    : SUSTAIN_DURATION_MS;

                  if (
                    sustained >= requiredSustain &&
                    frameNow - lastGazeAlertTimeRef.current >= GAZE_COOLDOWN_MS
                  ) {
                    gazeStateRef.current = "ALERT_ACTIVE";
                    lastGazeAlertTimeRef.current = frameNow;

                    const durationMs = sustained;
                    if (durationMs > longestGazeAwayRef.current) {
                      longestGazeAwayRef.current = durationMs;
                    }

                    addEvt({
                      id: createEventId(),
                      type: "GAZE_AWAY",
                      timestamp: frameNow,
                      severity: "warning",
                      metadata: {
                        durationMs,
                        gazeX: result.gaze.x,
                        gazeY: result.gaze.y,
                        yawDeg: result.yawDeg,
                        pitchDeg: result.pitchDeg,
                        maxDeviation: result.maxDeviation,
                      },
                    });
                  }
                }

                // While ALERT_ACTIVE — do NOT log again
                tqDeviationRef.current += deltaMs;
              }

              setGazeState(gazeStateRef.current);
            }

            // Update overlay result — assign isLookingAway based on state
            const displayResult = {
              ...result,
              isLookingAway:
                gazeStateRef.current === "ALERT_ACTIVE" ||
                gazeStateRef.current === "MONITORING_DEVIATION",
            };
            setLastGazeResult(displayResult);
          }
        }
      }

      // ── OBJECT inference (staggered by 1.5×) ───────────────────────────
      const staggeredInterval = INFERENCE_INTERVAL_MS * 1.5;
      if (now - lastObjInferenceRef.current >= staggeredInterval) {
        lastObjInferenceRef.current = now;

        if (video && isObjectModelReady()) {
          const result = await runObjectDetection(video);
          if (result) {
            setLastObjectResult(result);

            for (const det of result.detections) {
              const lastFor = objectCooldownMap.current.get(det.label) ?? 0;
              if (frameNow - lastFor >= OBJECT_DETECTION_COOLDOWN_MS) {
                objectCooldownMap.current.set(det.label, frameNow);
                addEvt({
                  id: createEventId(),
                  type: "OBJECT_DETECTED",
                  timestamp: frameNow,
                  severity: "suspicious",
                  metadata: {
                    label: det.label,
                    score: det.score,
                    bbox: det.bbox,
                  },
                });
              }
            }
          }
        }
      }

      // ── Update time-quality state (~4 Hz) ──────────────────────────────
      const totalMs =
        tqFocusedRef.current +
        tqMinorRef.current +
        tqDeviationRef.current +
        tqAbsenceRef.current;

      if (totalMs > 0 && now % 4 < 1) {
        setTimeQuality({
          focusedTimeMs: tqFocusedRef.current,
          minorMovementTimeMs: tqMinorRef.current,
          deviationTimeMs: tqDeviationRef.current,
          absenceTimeMs: tqAbsenceRef.current,
          totalSessionTimeMs: totalMs,
          focusRatio: Math.round(
            ((tqFocusedRef.current + tqMinorRef.current) / totalMs) * 100,
          ) / 100,
        });
      }

      // Schedule next frame
      aiRafRef.current = requestAnimationFrame((t) => {
        aiLoop(t).catch(console.error);
      });
    },
    [], // stable — uses refs only
  );

  useEffect(() => {
    if (!isSessionActive) {
      if (aiRafRef.current) {
        cancelAnimationFrame(aiRafRef.current);
        aiRafRef.current = null;
      }
      return;
    }

    lastFrameTimeRef.current = Date.now();
    aiRafRef.current = requestAnimationFrame((t) => {
      aiLoop(t).catch(console.error);
    });

    return () => {
      if (aiRafRef.current) {
        cancelAnimationFrame(aiRafRef.current);
        aiRafRef.current = null;
      }
    };
  }, [isSessionActive, aiLoop]);

  // ── Risk score recalculation (~4 Hz via elapsed update) ─────────────────
  useEffect(() => {
    if (!isSessionActive) {
      setRiskScore(0);
      return;
    }

    const riskInput = buildRiskInput(events, elapsedMs);
    const { score } = calculateRiskScore(riskInput);
    setRiskScore(score);
  }, [events, elapsedMs, isSessionActive, setRiskScore]);

  // ── Stable return value ────────────────────────────────────────────────────
  const elapsedLabel = useMemo(() => formatElapsed(elapsedMs), [elapsedMs]);

  return useMemo(
    () => ({
      status,
      elapsedMs,
      elapsedLabel,
      webcam,
      aiStatus,
      lastGazeResult,
      lastObjectResult,
      videoRef,
      gazeState,
      timeQuality,
    }),
    [
      status,
      elapsedMs,
      elapsedLabel,
      webcam,
      aiStatus,
      lastGazeResult,
      lastObjectResult,
      gazeState,
      timeQuality,
    ],
  );
}
