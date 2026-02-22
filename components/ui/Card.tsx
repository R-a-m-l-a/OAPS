import type { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

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
        "rounded-xl border border-sky-100 bg-white/80",
        "shadow-sm",
        "p-4",
        className,
      ].join(" ")}
    >
      {(title || subtitle || rightSlot) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="truncate text-sm font-semibold text-slate-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </header>
      )}

      <div>{children}</div>
    </section>
  );
}
