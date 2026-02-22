import { Card } from "@/components/ui/Card";

type Props = {
  isSessionActive: boolean;
  totalEvents: number;
  elapsedLabel?: string;
};

export function MetricsPanel({
  isSessionActive,
  totalEvents,
  elapsedLabel,
}: Props) {
  const safeElapsedLabel = isSessionActive ? (elapsedLabel ?? "00:00") : "00:00";

  return (
    <Card title="Session Metrics" subtitle="Live state snapshot" className="h-full">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Status
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {isSessionActive ? "Active" : "Inactive"}
          </div>
        </div>

        <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Events
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {totalEvents}
          </div>
        </div>

        <div className="rounded-lg border border-sky-100 bg-sky-50/60 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Timer
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {safeElapsedLabel}
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Phase 2 adds webcam preview, a session timer, and tab-switch event
        logging. AI engines are integrated in later phases.
      </p>
    </Card>
  );
}
