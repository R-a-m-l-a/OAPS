"use client";

type Props = {
  className?: string;
  label?: string;
};

/**
 * Loading spinner (e.g. for model loading).
 */
export function Loader({ className = "", label = "Loading…" }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--blue-500)] border-t-transparent"
        role="status"
        aria-label={label}
      />
      {label && (
        <p className="text-sm font-medium text-slate-500">{label}</p>
      )}
    </div>
  );
}
