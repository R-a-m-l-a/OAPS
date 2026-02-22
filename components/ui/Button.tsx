"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-500 disabled:bg-sky-200 disabled:text-sky-900/40",
  secondary:
    "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
  danger:
    "bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-200 disabled:text-rose-900/40",
};

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
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
        "transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:ring-offset-0",
        "disabled:cursor-not-allowed",
        variantClassName[variant],
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}
