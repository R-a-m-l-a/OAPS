"use client";

/**
 * Root page. Redirects to role-based dashboard or login.
 * Middleware also redirects /; this handles client-side navigation edge cases.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function HomePage() {
  const router = useRouter();
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const hasFetched = useAuthStore((s) => s.hasFetched);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!hasFetched) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    router.replace(user.role === "interviewer" ? "/interviewer" : "/interviewee");
  }, [hasFetched, user, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--blue-500)] border-t-transparent" />
    </div>
  );
}
