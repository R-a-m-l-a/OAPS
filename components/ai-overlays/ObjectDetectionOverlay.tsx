"use client";

/**
 * ObjectDetectionOverlay — components/ai-overlays/ObjectDetectionOverlay.tsx
 *
 * Renders bounding boxes with labels for each detected prohibited object
 * on top of the webcam video element.
 *
 * Visual design:
 *   - Red dashed bounding box per detected object.
 *   - Label badge with object class and confidence score.
 *   - Corner accent marks for a "targeting" aesthetic.
 *   - Count badge in top-right when objects are present.
 *
 * Performance:
 *   - Pure Canvas 2D — zero DOM nodes per detection.
 *   - React.memo to skip re-renders when detections haven't changed.
 *   - No internal RAF loop — driven by parent prop updates.
 */

import React, { useEffect, useRef } from "react";
import type { ObjectDetectionResult } from "@/types/metrics";

type Props = {
    result: ObjectDetectionResult | null;
    /** Dimensions of the container (should match the video element). */
    width: number;
    height: number;
};

const BOX_COLOR = "rgba(239,68,68,0.85)"; // red-500
const LABEL_BG = "rgba(239,68,68,0.85)";
const LABEL_TEXT = "#fff";
const CORNER_SIZE = 12;
const CORNER_WIDTH = 3;

function drawObjectOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    result: ObjectDetectionResult | null,
): void {
    ctx.clearRect(0, 0, w, h);

    if (!result || result.detections.length === 0) return;

    for (const det of result.detections) {
        const [bx, by, bw, bh] = det.bbox;

        // ── Dashed bounding box ───────────────────────────────────────────────
        ctx.save();
        ctx.strokeStyle = BOX_COLOR;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(bx, by, bw, bh);
        ctx.restore();

        // ── Corner accent marks ───────────────────────────────────────────────
        ctx.strokeStyle = BOX_COLOR;
        ctx.lineWidth = CORNER_WIDTH;
        ctx.setLineDash([]);

        // TL
        ctx.beginPath();
        ctx.moveTo(bx, by + CORNER_SIZE);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + CORNER_SIZE, by);
        ctx.stroke();

        // TR
        ctx.beginPath();
        ctx.moveTo(bx + bw - CORNER_SIZE, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + CORNER_SIZE);
        ctx.stroke();

        // BL
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - CORNER_SIZE);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + CORNER_SIZE, by + bh);
        ctx.stroke();

        // BR
        ctx.beginPath();
        ctx.moveTo(bx + bw - CORNER_SIZE, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - CORNER_SIZE);
        ctx.stroke();

        // ── Label badge ────────────────────────────────────────────────────────
        const labelText = `${det.label} ${Math.round(det.score * 100)}%`;
        ctx.font = "bold 11px system-ui, sans-serif";
        const textW = ctx.measureText(labelText).width;
        const badgeH = 18;
        const badgeX = bx;
        const badgeY = by > badgeH + 2 ? by - badgeH - 2 : by + 2;

        ctx.fillStyle = LABEL_BG;
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, textW + 10, badgeH, 4);
        ctx.fill();

        ctx.fillStyle = LABEL_TEXT;
        ctx.textAlign = "left";
        ctx.fillText(labelText, badgeX + 5, badgeY + 13);
    }

    // ── Object count badge (top-right corner) ──────────────────────────────
    const count = result.detections.length;
    const badgeLabel = `${count} ITEM${count > 1 ? "S" : ""} DETECTED`;
    ctx.font = "bold 11px system-ui, sans-serif";
    const bw2 = ctx.measureText(badgeLabel).width + 16;
    const bx2 = w - bw2 - 8;
    const by2 = 8;

    ctx.fillStyle = "rgba(239,68,68,0.9)";
    ctx.beginPath();
    ctx.roundRect(bx2, by2, bw2, 22, 5);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.textAlign = "left";
    ctx.fillText(badgeLabel, bx2 + 8, by2 + 15);
}

export const ObjectDetectionOverlay = React.memo(
    function ObjectDetectionOverlay({ result, width, height }: Props) {
        const canvasRef = useRef<HTMLCanvasElement | null>(null);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            canvas.width = width;
            canvas.height = height;
            drawObjectOverlay(ctx, width, height, result);
        }, [result, width, height]);

        return (
            <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
            />
        );
    },
);
