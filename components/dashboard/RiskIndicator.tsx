"use client";

/**
 * RiskIndicator — Phase 7 Elegant Blue
 *
 * Animated risk score display with blue accents for low risk.
 */

import { Card } from "@/components/ui/Card";

type Props = {
  riskScore: number;
};

type Level = { label: "Low" | "Medium" | "High"; color: string; bar: string };

function getRiskLevel(score: number): Level {
  if (score >= 70)
    return { label: "High", color: "text-rose-600", bar: "bg-rose-500" };
  if (score >= 35)
    return { label: "Medium", color: "text-amber-500", bar: "bg-amber-400" };
  return {
    label: "Low",
    color: "text-[var(--blue-600)]",
    bar: "bg-[var(--blue-500)]",
  };
}

export function RiskIndicator({ riskScore }: Props) {
  const clamped = Math.max(0, Math.min(100, riskScore));
  const level = getRiskLevel(clamped);

  return (
    <Card
      title="Risk"
      subtitle="Current session risk score"
      className="h-full"
      rightSlot={
        <span
          className={[
            "rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
            "transition-colors duration-300",
            level.label === "High"
              ? "animate-pulse bg-rose-100 text-rose-700"
              : level.label === "Medium"
                ? "bg-amber-100 text-amber-700"
                : "bg-[var(--blue-50)] text-[var(--blue-700)]",
          ].join(" ")}
        >
          {level.label}
        </span>
      }
    >
      {/* Score display */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div
            className={`text-4xl font-bold transition-all duration-500 tabular-nums ${level.color}`}
          >
            {clamped}
          </div>
          <div className="mt-1 text-xs text-slate-400">out of 100</div>
        </div>

        {/* Vertical bar chart */}
        <div className="flex h-16 items-end gap-0.5">
          {Array.from({ length: 10 }, (_, i) => {
            const threshold = (i + 1) * 10;
            const active = clamped >= threshold;
            const barColor = active
              ? threshold > 70
                ? "bg-rose-400"
                : threshold > 35
                  ? "bg-amber-400"
                  : "bg-[var(--blue-400)]"
              : "bg-slate-100";
            return (
              <div
                key={i}
                className={`w-3 rounded-sm transition-all duration-300 ${barColor}`}
                style={{ height: `${(i + 1) * 10}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Horizontal progress bar */}
      <div className="mt-5">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${level.bar}`}
            style={{ width: `${clamped}%` }}
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Risk score"
          />
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400">
          <span>0</span>
          <span>Low ← → High</span>
          <span>100</span>
        </div>
      </div>
    </Card>
  );
}
