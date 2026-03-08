"use client";

import type { ReactNode } from "react";

type Variant = "normal" | "success" | "warning" | "danger" | "info";

type Props = {
  variant?: Variant;
  children: ReactNode;
  className?: string;
};

const variantStyles: Record<Variant, string> = {
  normal: "bg-slate-50 text-slate-600 border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-[var(--blue-50)] text-[var(--blue-700)] border-[var(--border-accent)]",
};

/**
 * Status badge for labels and indicators.
 */
export function Badge({ variant = "normal", children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
