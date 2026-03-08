"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

export function Navbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
    router.refresh();
  };

  if (!user) return null;

  const dashboardHref = user.role === "interviewer" ? "/interviewer" : "/interviewee";

  return (
    <nav className="flex items-center gap-2 sm:gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-slate-700">{user.name}</p>
        <p className="text-[11px] text-slate-400">Authenticated user</p>
      </div>
      <span
        className={`rounded-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          user.role === "interviewer"
            ? "bg-[var(--blue-50)] text-[var(--blue-700)]"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {user.role}
      </span>
      <Link
        href={dashboardHref}
        className="hidden text-xs font-semibold text-[var(--blue-600)] transition-colors hover:text-[var(--blue-700)] sm:inline-flex"
      >
        My dashboard
      </Link>
      <Button variant="secondary" onClick={handleLogout} className="!px-3 !py-1.5 !text-xs">
        Log out
      </Button>
    </nav>
  );
}
