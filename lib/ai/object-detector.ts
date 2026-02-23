/**
 * Object Detection Module — lib/ai/object-detector.ts
 *
 * Uses @tensorflow-models/coco-ssd for real-time prohibited item detection.
 * Runs client-side via TF.js WebGL backend.
 *
 * Design decisions:
 * - COCO-SSD is already in package.json — no new dependencies.
 * - Model is lazy-loaded and cached per session.
 * - Only objects whose labels are in PROHIBITED_LABELS AND whose
 *   confidence >= CONFIDENCE_THRESHOLD are surfaced.
 * - Tensors are handled internally by the coco-ssd wrapper.
 * - disposeObjectModel() must be called on session end.
 *
 * @module object-detector
 */

import type { DetectedObject, ObjectDetectionResult } from "@/types/metrics";
import { CONFIDENCE_THRESHOLD, PROHIBITED_LABELS } from "@/lib/utils/constants";

// ─── Lazy model reference ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CocoSSDModel = any;

let _model: CocoSSDModel | null = null;
let _modelLoadPromise: Promise<CocoSSDModel> | null = null;
let _isModelLoaded = false;

/**
 * Load and cache the COCO-SSD model.
 * Uses the "lite_mobilenet_v2" base for maximum speed on low-end hardware.
 */
export async function loadObjectModel(): Promise<CocoSSDModel> {
    if (_isModelLoaded && _model) return _model;
    if (_modelLoadPromise) return _modelLoadPromise;

    _modelLoadPromise = (async () => {
        const tf = await import("@tensorflow/tfjs");
        await tf.setBackend("webgl");
        await tf.ready();

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const cocoSsd = await import("@tensorflow-models/coco-ssd");
        // lite_mobilenet_v2 is fastest and sufficient for demo
        const model = await cocoSsd.load({ base: "lite_mobilenet_v2" });

        _model = model;
        _isModelLoaded = true;
        return model;
    })();

    return _modelLoadPromise;
}

/** Returns true if the model is loaded and ready to infer. */
export function isObjectModelReady(): boolean {
    return _isModelLoaded && _model !== null;
}

/**
 * Dispose the COCO-SSD model and release GPU memory.
 * Must be called when the monitoring session ends.
 */
export function disposeObjectModel(): void {
    if (_model && typeof _model.dispose === "function") {
        try {
            _model.dispose();
        } catch {
            // Dispose errors are non-fatal; log and continue.
            console.warn("[object-detector] dispose error — ignored");
        }
    }
    _model = null;
    _modelLoadPromise = null;
    _isModelLoaded = false;
}

// ─── Inference ───────────────────────────────────────────────────────────────

/**
 * Run object detection on the current video frame.
 *
 * Only returns objects that:
 * 1. Have confidence >= CONFIDENCE_THRESHOLD (0.65)
 * 2. Belong to the PROHIBITED_LABELS set
 *
 * @param videoEl  - Live HTMLVideoElement with an active MediaStream.
 * @returns An ObjectDetectionResult (may contain empty detections array).
 */
export async function runObjectDetection(
    videoEl: HTMLVideoElement,
): Promise<ObjectDetectionResult | null> {
    if (!_isModelLoaded || !_model) return null;
    if (videoEl.readyState < 2) return null;

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawPredictions: any[] = await _model.detect(videoEl);

        const detections: DetectedObject[] = rawPredictions
            .filter(
                (p) =>
                    typeof p.score === "number" &&
                    p.score >= CONFIDENCE_THRESHOLD &&
                    PROHIBITED_LABELS.has(p.class as string),
            )
            .map(
                (p): DetectedObject => ({
                    label: p.class as string,
                    score: p.score as number,
                    bbox: p.bbox as [number, number, number, number],
                }),
            );

        return { detections, timestamp: Date.now() };
    } catch (err) {
        console.warn("[object-detector] Inference error:", err);
        return null;
    }
}
