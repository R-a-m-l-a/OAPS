"use client";

import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const baseClass =
  "w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-[0_1px_2px_rgba(15,23,42,0.03)] placeholder:text-slate-400 transition-all duration-200 focus:border-[var(--blue-400)] focus:outline-none focus:ring-4 focus:ring-[var(--blue-200)]/35";

/**
 * Styled form input for auth and forms.
 */
export function Input({ label, error, id, className = "", ...props }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseClass} ${error ? "border-rose-300" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
