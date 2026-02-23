"use client";

/**
 * GazeOverlay — Phase 5
 *
 * Renders gaze crosshair on Canvas 2D. Colour depends on state:
 *   - Green: face detected, focused
 *   - Amber: minor drift / monitoring deviation
 *   - Red: alert active (sustained strong deviation)
 *   - Slate: no face detected
 */

import React, { useEffect, useRef } from "react";
import type { GazeResult } from "@/types/metrics";

type Props = {
    result: GazeResult | null;
    width: number;
    height: number;
    /** Current gaze state from the state machine. */
    gazeState?: string;
};

function getGazeColor(result: GazeResult, state: string): string {
    if (!result.faceDetected) return "rgba(100,116,139,0.6)"; // slate
    if (state === "ALERT_ACTIVE") return "rgba(239,68,68,0.9)"; // red
    if (state === "MONITORING_DEVIATION") return "rgba(234,179,8,0.9)"; // amber
    if (state === "ABSENT") return "rgba(100,116,139,0.6)"; // slate
    const absMax = Math.max(Math.abs(result.gaze.x), Math.abs(result.gaze.y));
    if (absMax > 0.15) return "rgba(234,179,8,0.7)"; // light amber drift
    return "rgba(34,197,94,0.9)"; // green
}

function getStatusLabel(result: GazeResult, state: string): string {
    if (!result.faceDetected) return "NO FACE";
    if (state === "ABSENT") return "ABSENT";
    if (state === "ALERT_ACTIVE") return "GAZE: AWAY";
    if (state === "MONITORING_DEVIATION") return "GAZE: MONITORING";
    return "GAZE: ON";
}

function drawGazeOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    result: GazeResult | null,
    state: string,
): void {
    ctx.clearRect(0, 0, w, h);
    if (!result) return;

    const color = getGazeColor(result, state);
    const dotX = w / 2 + (result.gaze.x * w) / 2;
    const dotY = h / 2 + (result.gaze.y * h) / 2;

    // Outer ring
    ctx.beginPath();
    ctx.arc(dotX, dotY, 22, 0, Math.PI * 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Crosshair lines
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(dotX - 32, dotY); ctx.lineTo(dotX - 24, dotY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dotX + 24, dotY); ctx.lineTo(dotX + 32, dotY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dotX, dotY - 32); ctx.lineTo(dotX, dotY - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(dotX, dotY + 24); ctx.lineTo(dotX, dotY + 32); ctx.stroke();

    // Status label pill
    const label = getStatusLabel(result, state);
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.textAlign = "left";

    const labelX = 10;
    const labelY = h - 14;
    const textW = ctx.measureText(label).width;

    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.roundRect(labelX - 4, labelY - 13, textW + 8, 18, 4);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillText(label, labelX, labelY);
}

export const GazeOverlay = React.memo(function GazeOverlay({
    result,
    width,
    height,
    gazeState = "NORMAL",
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;
        drawGazeOverlay(ctx, width, height, result, gazeState);
    }, [result, width, height, gazeState]);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
        />
    );
});
