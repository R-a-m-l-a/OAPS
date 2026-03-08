import type { ReactNode } from "react";

type Props = {
  headerSlot?: ReactNode;
  metricsSlot: ReactNode;
  riskSlot: ReactNode;
  liveFeedSlot?: ReactNode;
  aiPanelSlot?: ReactNode;
  children?: ReactNode;
};

/**
 * DashboardLayout — Phase 7
 *
 * Elegant Blue themed grid layout with smooth transitions.
 */
export function DashboardLayout({
  headerSlot,
  metricsSlot,
  riskSlot,
  liveFeedSlot,
  aiPanelSlot,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 sm:py-7">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="animate-fade-in mb-6 rounded-3xl border border-[var(--border)] bg-white/95 px-5 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--blue-800)]">
                OAPS
                <span className="ml-2 text-sm font-medium text-slate-400">
                  AI Proctoring Dashboard
                </span>
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Gaze tracking · Object detection · Behavioral analysis · Risk
                scoring
              </p>
            </div>
            {headerSlot && (
              <div className="flex flex-wrap items-center gap-2.5">{headerSlot}</div>
            )}
          </div>
        </header>

        {/* ── Main Grid ───────────────────────────────────────────────── */}
        <main className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Row 1: Metrics + Risk */}
          <div className="animate-fade-in stagger-1 lg:col-span-2">
            {metricsSlot}
          </div>
          <div className="animate-fade-in stagger-2 lg:col-span-1">
            {riskSlot}
          </div>

          {/* Row 2: Live Feed + AI Panel */}
          {liveFeedSlot && (
            <div className="animate-fade-in stagger-3 lg:col-span-2">
              {liveFeedSlot}
            </div>
          )}
          {aiPanelSlot && (
            <div className="animate-fade-in stagger-4 lg:col-span-1">
              {aiPanelSlot}
            </div>
          )}

          {/* Row 3: optional */}
          {children && <div className="lg:col-span-3">{children}</div>}
        </main>
      </div>
    </div>
  );
}
