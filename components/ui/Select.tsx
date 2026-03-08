"use client";

import type { SelectHTMLAttributes } from "react";

type Option = { value: string; label: string };

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: Option[];
  error?: string;
};

const baseClass =
  "w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-sm text-[var(--foreground)] shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 focus:border-[var(--blue-400)] focus:outline-none focus:ring-4 focus:ring-[var(--blue-200)]/35";

/**
 * Styled select dropdown.
 */
export function Select({
  label,
  options,
  error,
  id,
  className = "",
  ...props
}: Props) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-xs font-semibold tracking-wide text-slate-500"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`${baseClass} ${error ? "border-rose-300" : ""} ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${selectId}-error` : undefined}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
