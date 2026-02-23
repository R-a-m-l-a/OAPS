/**
 * Typed metrics for OAPS AI monitoring.
 * Phase 5 — adds gaze state machine types, time-quality metrics, and compressed payload.
 */

// ─── Gaze ───────────────────────────────────────────────────────────────────

/** A detected face's landmark-derived gaze vector */
export type GazeVector = {
  /** Horizontal deviation from center: negative = left, positive = right */
  x: number;
  /** Vertical deviation from center: negative = up, positive = down */
  y: number;
};

/** Gaze tracking inference output */
export type GazeResult = {
  /** Normalised gaze direction (-1 to 1 on each axis) */
  gaze: GazeVector;
  /** Whether the face is considered to be looking away (set by state machine) */
  isLookingAway: boolean;
  /** Confidence that a face was detected (0–1) */
  faceDetectionConfidence: number;
  /** Whether any face was found in the frame */
  faceDetected: boolean;
  /** Raw timestamp of inference */
  timestamp: number;
  /** Maximum absolute deviation across both axes */
  maxDeviation: number;

  // ── Phase 5.1 — Head Pose Angles (approximate degrees) ──────────────────
  /** Horizontal head rotation: positive = right, negative = left */
  yawDeg: number;
  /** Vertical head tilt: positive = looking down, negative = looking up */
  pitchDeg: number;
  /** Head roll (tilt): positive = clockwise */
  rollDeg: number;

  // ── Phase 5.1 — Classification Flags ────────────────────────────────────
  /** True when head pose is within the safe laptop-viewing zone. */
  inSafeZone: boolean;
  /** True when head pose exceeds strong deviation thresholds. */
  isStrongDeviation: boolean;
  /** True when face bounding box is centered in the video frame. */
  isCentered: boolean;
};

// ─── Gaze State Machine (Phase 5) ───────────────────────────────────────────

export type GazeState = "NORMAL" | "MONITORING_DEVIATION" | "ALERT_ACTIVE" | "ABSENT";

// ─── Object Detection ───────────────────────────────────────────────────────

/** A single object detection result from COCO-SSD */
export type DetectedObject = {
  /** COCO class label (e.g. "cell phone", "book") */
  label: string;
  /** Detection confidence (0–1) */
  score: number;
  /** Bounding box in video-element pixel coordinates */
  bbox: [number, number, number, number]; // [x, y, width, height]
};

/** Object detection inference output */
export type ObjectDetectionResult = {
  detections: DetectedObject[];
  timestamp: number;
};

// ─── Risk Calculator ────────────────────────────────────────────────────────

/** Inputs to the saturated risk-score calculator (Phase 5). */
export type RiskInput = {
  gazeDeviationCount: number;
  faceAbsenceCount: number;
  objectDetectionCount: number;
  tabSwitchCount: number;
  sessionDurationMs: number;
};

/** Risk scoring output */
export type RiskOutput = {
  score: number; // 0–100
  level: "Low" | "Medium" | "High";
};

// ─── Time-Quality Metrics (Phase 5 — PART 4) ───────────────────────────────

/** Tracks how the candidate spent their session time. */
export type TimeQualityMetrics = {
  focusedTimeMs: number;
  minorMovementTimeMs: number;
  deviationTimeMs: number;
  absenceTimeMs: number;
  totalSessionTimeMs: number;
  /** focusedTime / totalSessionTime — expected 0.85–0.95 for realistic sessions. */
  focusRatio: number;
};

// ─── Aggregated Summary ─────────────────────────────────────────────────────

/** Aggregated metrics snapshot for the dashboard & Gemini. */
export type MetricsSummary = {
  gazeDeviationCount: number;
  faceAbsenceCount: number;
  objectDetectionCount: number;
  tabSwitchCount: number;
  riskScore: number;
  riskLevel: "Low" | "Medium" | "High";
  sessionDurationMs: number;
  focusRatio: number;
  longestGazeAwayMs: number;
};

// ─── Compressed Gemini Payload (Phase 5 — PART 7) ───────────────────────────

/** Strict compressed payload for the Gemini API. No raw events. */
export type GeminiPayload = {
  sessionDurationSec: number;
  focusRatio: number;
  gazeIncidents: number;
  longestGazeAwaySec: number;
  faceAbsenceEvents: number;
  objectIncidents: number;
  tabSwitches: number;
  riskScore: number;
};
