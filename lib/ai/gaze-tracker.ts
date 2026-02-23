/**
 * Gaze Tracking Module — Phase 5.1
 *
 * Uses @tensorflow-models/blazeface for facial landmarks.
 *
 * Phase 5.1 additions:
 * - estimateHeadPose() derives approximate yaw/pitch/roll from BlazeFace
 *   6-point landmarks (rightEye, leftEye, nose, mouth, rightEar, leftEar).
 * - classifyGaze() applies angle-based safe zone and strong deviation logic.
 * - isFaceCentered() checks face bounding box position in frame.
 *
 * All state-machine logic remains in useMonitoring.
 * This module ONLY measures and classifies — never logs.
 *
 * @module gaze-tracker
 */

import type { GazeResult, GazeVector } from "@/types/metrics";
import {
    MIN_FACE_CONFIDENCE,
    MAX_YAW_NORMAL,
    MAX_PITCH_NORMAL,
    STRONG_YAW_DEG,
    STRONG_PITCH_UP_DEG,
    STRONG_PITCH_DOWN_DEG,
    FACE_CENTER_TOLERANCE_X,
    FACE_CENTER_TOLERANCE_Y,
} from "@/lib/utils/constants";

// ─── Lazy model reference ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlazeFaceModel = any;

let _model: BlazeFaceModel | null = null;
let _modelLoadPromise: Promise<BlazeFaceModel> | null = null;
let _isModelLoaded = false;

export async function loadGazeModel(): Promise<BlazeFaceModel> {
    if (_isModelLoaded && _model) return _model;
    if (_modelLoadPromise) return _modelLoadPromise;

    _modelLoadPromise = (async () => {
        const tf = await import("@tensorflow/tfjs");
        await tf.setBackend("webgl");
        await tf.ready();

        const blazeface = await import("@tensorflow-models/blazeface");
        const model = await blazeface.load();

        _model = model;
        _isModelLoaded = true;
        return model;
    })();

    return _modelLoadPromise;
}

export function isGazeModelReady(): boolean {
    return _isModelLoaded && _model !== null;
}

export function disposeGazeModel(): void {
    _model = null;
    _modelLoadPromise = null;
    _isModelLoaded = false;
}

// ─── Head Pose Estimation ────────────────────────────────────────────────────

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Estimate approximate head yaw/pitch/roll from BlazeFace landmarks.
 *
 * BlazeFace keypoints:
 *   0: right eye, 1: left eye, 2: nose, 3: mouth,
 *   4: right ear, 5: left ear
 *
 * Yaw: nose horizontal offset from eye midpoint, normalised by face width.
 * Pitch: nose vertical position relative to the expected midpoint between
 *        eyes and mouth. Positive = looking down.
 * Roll: angle of the inter-eye line vs horizontal.
 */
function estimateHeadPose(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prediction: any,
): { yawDeg: number; pitchDeg: number; rollDeg: number } {
    const landmarks = prediction.landmarks as number[][];
    const rightEye = landmarks[0];
    const leftEye = landmarks[1];
    const nose = landmarks[2];
    const mouth = landmarks[3];

    if (!rightEye || !leftEye || !nose || !mouth) {
        return { yawDeg: 0, pitchDeg: 0, rollDeg: 0 };
    }

    const topLeft = prediction.topLeft as [number, number];
    const bottomRight = prediction.bottomRight as [number, number];
    const faceW = Math.max(bottomRight[0] - topLeft[0], 1);

    const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
    const eyeMidY = (rightEye[1] + leftEye[1]) / 2;

    // ── YAW ────────────────────────────────────────────────────────────────────
    //  Nose offset from eye midpoint, normalised by face width × 0.3
    //  (empirical scaling: full-face-width offset ≈ 90°,
    //   so factor 0.3 maps realistic range to ±1 before asin)
    const yawNorm = Math.max(-1, Math.min(1, (nose[0] - eyeMidX) / (faceW * 0.3)));
    const rawYawDeg = Math.asin(yawNorm) * RAD_TO_DEG;
    // Negate for user-facing (mirrored) camera
    const yawDeg = -rawYawDeg;

    // ── PITCH ──────────────────────────────────────────────────────────────────
    //  The nose sits ~45% of the way from eyes to mouth when facing forward.
    //  When tilting down, the nose moves proportionally toward the mouth.
    const eyeToMouthDist = Math.max(mouth[1] - eyeMidY, 1);
    const eyeToNoseDist = nose[1] - eyeMidY;
    const pitchRatio = eyeToNoseDist / eyeToMouthDist;
    //  Centre around neutral (~0.45), scale ×3 so ±0.33 maps to ±1
    const pitchNorm = Math.max(-1, Math.min(1, (pitchRatio - 0.45) * 3));
    const pitchDeg = Math.asin(pitchNorm) * RAD_TO_DEG;

    // ── ROLL ───────────────────────────────────────────────────────────────────
    const dx = leftEye[0] - rightEye[0];
    const dy = leftEye[1] - rightEye[1];
    const rollDeg = Math.atan2(dy, dx) * RAD_TO_DEG;

    return { yawDeg, pitchDeg, rollDeg };
}

// ─── Face Centering Check ────────────────────────────────────────────────────

function isFaceCentered(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prediction: any,
    videoWidth: number,
    videoHeight: number,
): boolean {
    const topLeft = prediction.topLeft as [number, number];
    const bottomRight = prediction.bottomRight as [number, number];
    const faceCenterX = (topLeft[0] + bottomRight[0]) / 2;
    const faceCenterY = (topLeft[1] + bottomRight[1]) / 2;

    const frameCenterX = videoWidth / 2;
    const frameCenterY = videoHeight / 2;

    return (
        Math.abs(faceCenterX - frameCenterX) <= videoWidth * FACE_CENTER_TOLERANCE_X &&
        Math.abs(faceCenterY - frameCenterY) <= videoHeight * FACE_CENTER_TOLERANCE_Y
    );
}

// ─── Angle-Based Classification ──────────────────────────────────────────────

/**
 * Determines if the head pose falls within the safe laptop-viewing zone.
 * Within this zone, the state machine MUST force NORMAL.
 */
function isInSafeZone(yawDeg: number, pitchDeg: number): boolean {
    return Math.abs(yawDeg) <= MAX_YAW_NORMAL && Math.abs(pitchDeg) <= MAX_PITCH_NORMAL;
}

/**
 * Determines if the head pose exceeds the strong deviation thresholds.
 * Asymmetric for pitch: downward is more lenient than upward.
 *
 * Strong = abs(yaw) > 25° OR pitchUp > 30° OR pitchDown > 35°
 */
function isStrongDeviationCheck(yawDeg: number, pitchDeg: number): boolean {
    if (Math.abs(yawDeg) > STRONG_YAW_DEG) return true;
    // Negative pitch = looking up, positive pitch = looking down
    if (pitchDeg < -STRONG_PITCH_UP_DEG) return true;   // strong upward
    if (pitchDeg > STRONG_PITCH_DOWN_DEG) return true;   // strong downward (lenient)
    return false;
}

// ─── Gaze Vector ─────────────────────────────────────────────────────────────

function deriveGazeVector(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prediction: any,
): GazeVector {
    const landmarks = prediction.landmarks as number[][];
    const rightEye = landmarks[0];
    const leftEye = landmarks[1];

    if (!rightEye || !leftEye) return { x: 0, y: 0 };

    const eyeMidX = (rightEye[0] + leftEye[0]) / 2;
    const eyeMidY = (rightEye[1] + leftEye[1]) / 2;

    const topLeft = prediction.topLeft as [number, number];
    const bottomRight = prediction.bottomRight as [number, number];
    const faceCx = (topLeft[0] + bottomRight[0]) / 2;
    const faceCy = (topLeft[1] + bottomRight[1]) / 2;
    const faceW = bottomRight[0] - topLeft[0];
    const faceH = bottomRight[1] - topLeft[1];

    const halfW = Math.max(faceW / 2, 1);
    const halfH = Math.max(faceH / 2, 1);

    const x = Math.max(-1, Math.min(1, (eyeMidX - faceCx) / halfW));
    const y = Math.max(-1, Math.min(1, (eyeMidY - faceCy) / halfH));

    return { x: -x, y };
}

// ─── No-face result factory ──────────────────────────────────────────────────

const NO_FACE_RESULT: Omit<GazeResult, "faceDetectionConfidence"> = {
    gaze: { x: 0, y: 0 },
    isLookingAway: false,
    faceDetected: false,
    timestamp: 0,
    maxDeviation: 0,
    yawDeg: 0,
    pitchDeg: 0,
    rollDeg: 0,
    inSafeZone: false,
    isStrongDeviation: false,
    isCentered: false,
};

// ─── Inference ───────────────────────────────────────────────────────────────

/**
 * Run a single gaze-tracking inference.
 *
 * Returns raw measurements + angle-based classification flags.
 * The state machine in useMonitoring uses these flags to decide
 * NORMAL vs MONITORING_DEVIATION vs ALERT.
 */
export async function runGazeInference(
    videoEl: HTMLVideoElement,
): Promise<GazeResult | null> {
    if (!_isModelLoaded || !_model) return null;
    if (videoEl.readyState < 2) return null;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const predictions: any[] = await _model.estimateFaces(videoEl, false);

        const now = Date.now();

        if (!predictions || predictions.length === 0) {
            return { ...NO_FACE_RESULT, faceDetectionConfidence: 0, timestamp: now };
        }

        // Pick highest-confidence face
        const best = predictions.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (a: any, b: any) =>
                (b.probability?.[0] ?? 0) > (a.probability?.[0] ?? 0) ? b : a,
            predictions[0],
        );

        const confidence: number = best.probability?.[0] ?? 1;

        if (confidence < MIN_FACE_CONFIDENCE) {
            return { ...NO_FACE_RESULT, faceDetectionConfidence: confidence, timestamp: now };
        }

        // ── Derive measurements ──────────────────────────────────────────────
        const gaze = deriveGazeVector(best);
        const maxDeviation = Math.max(Math.abs(gaze.x), Math.abs(gaze.y));
        const { yawDeg, pitchDeg, rollDeg } = estimateHeadPose(best);

        // ── Classify ─────────────────────────────────────────────────────────
        const safeZone = isInSafeZone(yawDeg, pitchDeg);
        const strongDev = isStrongDeviationCheck(yawDeg, pitchDeg);
        const centered = isFaceCentered(best, videoEl.videoWidth, videoEl.videoHeight);

        return {
            gaze,
            isLookingAway: false, // state machine in hook decides this
            faceDetectionConfidence: confidence,
            faceDetected: true,
            timestamp: now,
            maxDeviation,
            yawDeg,
            pitchDeg,
            rollDeg,
            inSafeZone: safeZone,
            isStrongDeviation: strongDev,
            isCentered: centered,
        };
    } catch (err) {
        console.warn("[gaze-tracker] Inference error:", err);
        return null;
    }
}
