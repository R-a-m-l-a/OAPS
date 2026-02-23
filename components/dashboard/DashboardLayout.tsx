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
      <div className="mx-auto w-full max-w-7xl px-5 py-6">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <header className="mb-6 animate-fade-in rounded-2xl border border-[var(--border)] bg-white/90 px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[var(--blue-800)]">
                OAPS
                <span className="ml-1.5 text-sm font-medium text-slate-400">
                  AI Proctoring Dashboard
                </span>
              </h1>
              <p className="mt-0.5 text-[11px] text-slate-400">
                Gaze tracking · Object detection · Behavioral analysis · Risk
                scoring
              </p>
            </div>
            {headerSlot && (
              <div className="flex flex-wrap items-center gap-2">{headerSlot}</div>
            )}
          </div>
        </header>

        {/* ── Main Grid ───────────────────────────────────────────────── */}
        <main className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Row 1: Metrics + Risk */}
          <div className="md:col-span-2 animate-fade-in stagger-1">
            {metricsSlot}
          </div>
          <div className="md:col-span-1 animate-fade-in stagger-2">
            {riskSlot}
          </div>

          {/* Row 2: Live Feed + AI Panel */}
          {liveFeedSlot && (
            <div className="md:col-span-2 animate-fade-in stagger-3">
              {liveFeedSlot}
            </div>
          )}
          {aiPanelSlot && (
            <div className="md:col-span-1 animate-fade-in stagger-4">
              {aiPanelSlot}
            </div>
          )}

          {/* Row 3: optional */}
          {children && <div className="md:col-span-3">{children}</div>}
        </main>
      </div>
    </div>
  );
}
