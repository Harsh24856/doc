import { useId } from "react";
import { motion } from "motion/react";
import { cn, enter } from "./cn";
import Icon from "./Icon";

/**
 * Segmented tabs. The active pill slides between tabs (transform, 200ms ease-out).
 * items: [{ value, label, icon?, count? }]
 */
export default function Tabs({ items, value, onChange, className, size = "md", fullWidth = false, label }) {
  const layoutId = useId();
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "relative inline-flex max-w-full gap-1 overflow-x-auto rounded-[8px] border border-gray-200 bg-gray-100 p-1 no-scrollbar",
        fullWidth && "flex w-full",
        className
      )}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative z-0 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[5px] font-mono font-medium uppercase tracking-[0.12em] transition-colors duration-150",
              size === "sm" ? "h-8 px-3 text-[10px]" : "h-9 px-4 text-[11px]",
              fullWidth && "flex-1",
              active ? "text-gray-900" : "text-gray-500 hover:text-gray-800"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={enter}
                className="absolute inset-0 -z-10 rounded-[5px] bg-white shadow-[var(--shadow-soft)] ring-1 ring-gray-200"
              />
            )}
            {it.icon && <Icon name={it.icon} className={cn("text-[18px]", active && "text-coral-600")} />}
            {it.label}
            {it.count != null && (
              <span className={cn("ml-0.5 text-xs tabular-nums", active ? "text-coral-700" : "text-gray-400")}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
