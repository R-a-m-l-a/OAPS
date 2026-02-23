"use client";

/**
 * MetricsPanel — Phase 7 Elegant Blue
 *
 * Refined metric tiles with Elegant Blue accents and smooth transitions.
 */

import { Card } from "@/components/ui/Card";

type Props = {
  isSessionActive: boolean;
  totalEvents: number;
  gazeAlerts: number;
  faceAbsent: number;
  objectDetections: number;
  tabSwitches: number;
  elapsedLabel?: string;
  riskScore: number;
  focusRatio: number;
};

type MetTileProps = {
  label: string;
  value: string | number;
  accent?: "normal" | "warning" | "danger" | "success";
};

function MetTile({ label, value, accent = "normal" }: MetTileProps) {
  const accentMap = {
    normal: "border-[var(--border)] bg-[var(--blue-50)]/60 text-[var(--foreground)]",
    warning: "border-amber-200 bg-amber-50/70 text-amber-800",
    danger: "border-rose-200 bg-rose-50/60 text-rose-700",
    success: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
  };

  return (
    <div
      className={`rounded-xl border p-3 transition-all duration-200 ${accentMap[accent]}`}
    >
      <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}

export function MetricsPanel({
  isSessionActive,
  totalEvents,
  gazeAlerts,
  faceAbsent,
  objectDetections,
  tabSwitches,
  elapsedLabel,
  riskScore,
  focusRatio,
}: Props) {
  const safeLabel = isSessionActive ? (elapsedLabel ?? "00:00") : "00:00";
  const riskAccent: MetTileProps["accent"] =
    riskScore >= 70 ? "danger" : riskScore >= 35 ? "warning" : "normal";
  const focusPct = `${Math.round(focusRatio * 100)}%`;
  const focusAccent: MetTileProps["accent"] =
    focusRatio >= 0.85 ? "success" : focusRatio >= 0.6 ? "warning" : "danger";

  return (
    <Card title="Session Metrics" subtitle="Real-time monitoring state" className="h-full">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        <MetTile
          label="Status"
          value={isSessionActive ? "Active" : "Inactive"}
          accent={isSessionActive ? "success" : "normal"}
        />
        <MetTile label="Timer" value={safeLabel} />
        <MetTile label="Events" value={totalEvents} />
        <MetTile
          label="Gaze Away"
          value={gazeAlerts}
          accent={gazeAlerts > 0 ? "warning" : "normal"}
        />
        <MetTile
          label="Absent"
          value={faceAbsent}
          accent={faceAbsent > 0 ? "danger" : "normal"}
        />
        <MetTile
          label="Objects"
          value={objectDetections}
          accent={objectDetections > 0 ? "danger" : "normal"}
        />
        <MetTile
          label="Tab Switch"
          value={tabSwitches}
          accent={tabSwitches > 0 ? "warning" : "normal"}
        />
        <MetTile label="Focus" value={focusPct} accent={focusAccent} />
      </div>

      {/* Risk bar */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Risk
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${riskAccent === "danger"
                ? "bg-rose-500"
                : riskAccent === "warning"
                  ? "bg-amber-400"
                  : "bg-[var(--blue-500)]"
              }`}
            style={{ width: `${riskScore}%` }}
          />
        </div>
        <MetTile label="Score" value={riskScore} accent={riskAccent} />
      </div>
    </Card>
  );
}
