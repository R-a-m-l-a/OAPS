"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/dashboard/Navbar";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const hasFetched = useAuthStore((s) => s.hasFetched);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (!hasFetched) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="rounded-2xl border border-[var(--border)] bg-white px-6 py-5 shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--blue-500)] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-sm font-semibold tracking-wide text-[var(--blue-700)]">
            OAPS
          </span>
          <Navbar />
        </div>
      </div>
      {children}
    </div>
  );
}
