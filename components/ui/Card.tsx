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
        "rounded-2xl border border-[var(--border)] bg-white/95",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "p-5",
        "transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        className,
      ].join(" ")}
    >
      {(title || subtitle || rightSlot) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-sm font-semibold text-[var(--foreground)]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[11px] text-slate-400">{subtitle}</p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </header>
      )}

      <div>{children}</div>
    </section>
  );
}
