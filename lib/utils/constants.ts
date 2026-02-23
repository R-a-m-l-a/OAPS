/**
 * Shared constants for the OAPS monitoring system.
 * Phase 5.1 — Angle-based gaze calibration & saturated risk model.
 */

// ─── Inference ──────────────────────────────────────────────────────────────

/** Minimum detection confidence for both gaze & object models (0–1). */
export const CONFIDENCE_THRESHOLD = 0.65;

/** Target inference frame rate (inferences per second). */
export const INFERENCE_FPS = 10;

/** Milliseconds between AI inference frames. */
export const INFERENCE_INTERVAL_MS = 1000 / INFERENCE_FPS;

/** Timer UI update frequency (ms). */
export const TIMER_UPDATE_INTERVAL_MS = 250;

// ─── Gaze State Machine — Phase 5 ──────────────────────────────────────────

/** Minor eye movement within this threshold is NORMAL (tracked but ignored). */
export const SLIGHT_DEVIATION = 0.28;

/** Strong directional deviation threshold — starts the sustain timer. */
export const STRONG_DEVIATION = 0.45;

/** How long (ms) a strong deviation must be sustained before logging. */
export const SUSTAIN_DURATION_MS = 2500;

/** Cooldown (ms) after a GAZE_AWAY event before another can be logged. */
export const GAZE_COOLDOWN_MS = 5000;

/** Minimum face detection confidence to consider the face "present". */
export const MIN_FACE_CONFIDENCE = 0.6;

/** How long (ms) face must be absent before logging FACE_ABSENT. */
export const FACE_ABSENCE_SUSTAIN_MS = 2500;

/** Cooldown (ms) after FACE_ABSENT before another can be logged. */
export const FACE_ABSENCE_COOLDOWN_MS = 5000;

// ─── Phase 5.1 — Angle-Based Gaze Calibration ──────────────────────────────

/** Safe zone: max horizontal rotation (degrees) where gaze is always NORMAL. */
export const MAX_YAW_NORMAL = 18;

/** Safe zone: max vertical tilt (degrees) where gaze is always NORMAL.
 *  Allows natural laptop-screen viewing angle. */
export const MAX_PITCH_NORMAL = 22;

/** Max roll angle (degrees) for normal posture. */
export const MAX_ROLL_NORMAL = 15;

/** Strong yaw threshold — beyond this, lateral disengagement is considered. */
export const STRONG_YAW_DEG = 25;

/** Strong upward pitch threshold (degrees). */
export const STRONG_PITCH_UP_DEG = 30;

/** Strong downward pitch threshold (degrees).
 *  More lenient than upward because looking at laptop screen is natural. */
export const STRONG_PITCH_DOWN_DEG = 35;

/** Frame-centering tolerance for face bounding box (fraction of frame dim). */
export const FACE_CENTER_TOLERANCE_X = 0.20;
export const FACE_CENTER_TOLERANCE_Y = 0.25;

/** When face is centered, use this longer sustain before alerting (ms). */
export const CENTERED_SUSTAIN_DURATION_MS = 3500;

// ─── Legacy alias ───────────────────────────────────────────────────────────
/** @deprecated Use STRONG_DEVIATION for state machine; kept for raw inference. */
export const GAZE_DEVIATION_THRESHOLD = SLIGHT_DEVIATION;

// ─── Object Detection ───────────────────────────────────────────────────────

/** Labels from COCO-SSD considered prohibited in a proctored exam. */
export const PROHIBITED_LABELS: ReadonlySet<string> = new Set([
    "cell phone",
    "book",
    "laptop",
    "remote",
    "keyboard",
    "mouse",
    "tablet",
    "paper",
    "notepad",
]);

/** Cooldown between logging the SAME object label (ms). */
export const OBJECT_DETECTION_COOLDOWN_MS = 5000;

// ─── Risk Score — Saturated Weighted Model (Phase 5) ────────────────────────

/**
 * Capped weights for the saturated risk model.
 * Each event type has a max incident cap and per-incident weight.
 *
 * gazeImpact    = min(gazeIncidents, 5)  × 8     → max 40
 * absenceImpact = min(absenceIncidents, 3) × 15  → max 45
 * objectImpact  = min(objectIncidents, 3) × 20   → max 60
 * tabImpact     = min(tabSwitches, 5) × 6        → max 30
 *                                        theoretical max = 175 → clamped 100
 */
export const RISK_WEIGHTS = {
    gazeDeviation: { weight: 8, cap: 5 },
    faceAbsence: { weight: 15, cap: 3 },
    objectDetection: { weight: 20, cap: 3 },
    tabSwitch: { weight: 6, cap: 5 },
} as const;

/** Risk level thresholds. */
export const RISK_THRESHOLDS = {
    medium: 35,
    high: 70,
} as const;
