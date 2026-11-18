import { cn } from "./cn";

/**
 * Card: the base surface (white, 1px border, soft shadow).
 * `interactive` adds hover feedback: 2px lift, darker border, deeper shadow (200ms ease-out).
 */
export default function Card({ as: Comp = "div", interactive = false, className, children, ...rest }) {
  return (
    <Comp
      className={cn(
        "ds-card",
        interactive &&
          "group cursor-pointer transition-[transform,box-shadow,border-color] duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[var(--shadow-lift)] active:translate-y-0",
        className
      )}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/** Card header: optional icon tile, title, subtitle, trailing action. */
export function CardHeader({ icon, title, subtitle, action, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
            <span className="material-symbols-rounded text-[22px]" aria-hidden>
              {icon}
            </span>
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
