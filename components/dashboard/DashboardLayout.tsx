import type { ReactNode } from "react";

type Props = {
  headerSlot?: ReactNode;
  metricsSlot: ReactNode;
  riskSlot: ReactNode;
  children?: ReactNode;
};

export function DashboardLayout({ headerSlot, metricsSlot, riskSlot, children }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-white text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-900">
              OAPS Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Core session lifecycle & state display (Phase 1)
            </p>
          </div>
          {headerSlot && <div className="flex flex-wrap items-center gap-2">{headerSlot}</div>}
        </header>

        <main className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">{metricsSlot}</div>
          <div className="md:col-span-1">{riskSlot}</div>

          {children && <div className="md:col-span-3">{children}</div>}
        </main>
      </div>
    </div>
  );
}
