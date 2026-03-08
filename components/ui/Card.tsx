import type { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Card — Phase 7 Elegant Blue
 *
 * Refined surface with soft shadow and border, consistent spacing.
 */
export function Card({
  title,
  subtitle,
  rightSlot,
  children,
  className = "",
}: Props) {
  return (
    <section
      className={[
        "rounded-3xl border border-[var(--border)] bg-white/95",
        "shadow-[0_12px_26px_rgba(15,23,42,0.06)]",
        "p-6",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]",
        className,
      ].join(" ")}
    >
      {(title || subtitle || rightSlot) && (
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-base font-semibold tracking-tight text-[var(--foreground)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </header>
      )}

      <div>{children}</div>
    </section>
  );
}
