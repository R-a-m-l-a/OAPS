"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: [
    "bg-[var(--blue-600)] text-white",
    "hover:bg-[var(--blue-700)]",
    "active:bg-[var(--blue-800)]",
    "disabled:bg-[var(--blue-200)] disabled:text-[var(--blue-400)]",
    "shadow-sm hover:shadow",
  ].join(" "),
  secondary: [
    "bg-white text-[var(--foreground)]",
    "border border-[var(--border)]",
    "hover:bg-slate-50 hover:border-slate-300",
    "active:bg-slate-100",
    "disabled:bg-slate-50 disabled:text-slate-400",
  ].join(" "),
  danger: [
    "bg-rose-600 text-white",
    "hover:bg-rose-700",
    "active:bg-rose-800",
    "disabled:bg-rose-200 disabled:text-rose-400",
    "shadow-sm hover:shadow",
  ].join(" "),
};

/**
 * Button — Phase 7 Elegant Blue
 *
 * Primary uses the blue palette. Smooth transitions and focus ring.
 */
export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        "transition-all duration-150 ease-in-out",
        "focus:outline-none focus:ring-2 focus:ring-[var(--blue-400)]/40 focus:ring-offset-1",
        "disabled:cursor-not-allowed",
        variantClassName[variant],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
