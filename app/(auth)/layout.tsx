import type { ReactNode } from "react";

/**
 * Centered layout for login and signup pages.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[var(--blue-100)]/60 blur-3xl" />
        <div className="absolute -right-16 bottom-4 h-64 w-64 rounded-full bg-[var(--blue-200)]/40 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <div className="w-full">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-3 inline-flex items-center rounded-full border border-[var(--border-accent)] bg-[var(--blue-50)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--blue-700)]">
              OAPS Platform
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--blue-900)]">
              Online Assessment Proctoring
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Secure login for interviewers and interviewees
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
