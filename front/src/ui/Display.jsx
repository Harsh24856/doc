import { motion } from "motion/react";
import { cn, dur, easeOut } from "./cn";
import Icon from "./Icon";
import { CountUp } from "./Motion";

const badgeTones = {
  neutral: "bg-gray-100 text-gray-700",
  brand: "bg-coral-50 text-coral-700",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-coral-100 text-coral-800",
  info: "bg-indigo-50 text-indigo-700",
};

/** Status chip. Use for statuses only, never to decorate static metadata. */
export function Badge({ tone = "neutral", icon, children, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em]", badgeTones[tone], className)}>
      {icon && <Icon name={icon} className="text-[14px]" />}
      {children}
    </span>
  );
}

/** Map a backend status string to a badge tone. */
export function statusTone(status = "") {
  const s = String(status).toLowerCase();
  if (["approved", "verified", "accepted", "active", "hired", "shortlisted", "success", "open"].some((k) => s.includes(k))) return "success";
  if (["pending", "review", "submitted", "applied", "processing"].some((k) => s.includes(k))) return "warning";
  if (["reject", "declined", "failed", "closed", "expired"].some((k) => s.includes(k))) return "danger";
  return "neutral";
}

const avatarTones = ["bg-coral-500", "bg-coral-600", "bg-coral-400", "bg-coral-700"];

export function Avatar({ name = "", src, size = 40, className }) {
  const initials =
    String(name)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";
  const color = avatarTones[(String(name).charCodeAt(0) || 0) % avatarTones.length];
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white", color, className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="ds-card space-y-3 p-5" aria-hidden>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/** Empty state: monochrome icon, heading, one sentence, one next action. */
export function EmptyState({ icon = "inbox", title, description, action, className }) {
  return (
    <div className={cn("flex animate-fade-up flex-col items-center justify-center px-6 py-14 text-center", className)}>
      <Icon name={icon} className="mb-4 text-[36px] text-gray-400" />
      <h3 className="text-lg font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Page header: eyebrow, title, description, actions. */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn("mb-8 flex animate-fade-up flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="ds-eyebrow mb-3">{eyebrow}</p>}
        <h1 className="ds-display text-[32px] sm:text-[44px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** KPI tile with a count-up value. */
export function StatCard({ icon, label, value, suffix, hint, tone = "brand", delay = 0 }) {
  const tones = {
    brand: "bg-coral-50 text-coral-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    info: "bg-indigo-50 text-indigo-600",
    neutral: "bg-gray-100 text-gray-600",
  };
  const numeric = value !== "" && value !== null && value !== undefined && !isNaN(Number(value));
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: dur.slow, ease: easeOut }}
      className="ds-card p-5 transition-[box-shadow,border-color] duration-200 hover:border-gray-300 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ds-label">{label}</p>
          <p className="mt-2 font-display text-[32px] font-medium leading-none tracking-tight text-gray-900">{numeric ? <CountUp to={Number(value)} suffix={suffix} /> : value ?? "—"}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
        {icon && (
          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tones[tone])}>
            <Icon name={icon} />
          </span>
        )}
      </div>
    </motion.div>
  );
}

/** On/off switch; the knob slides with transform (150ms). */
export function Switch({ checked, onChange, label, disabled }) {
  return (
    <label className={cn("inline-flex items-center gap-3", disabled ? "opacity-50" : "cursor-pointer")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn("relative h-6 w-11 rounded-full transition-colors duration-150", checked ? "bg-coral-500" : "bg-gray-300")}
      >
        <span
          className={cn("absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ease-[var(--ease-out)]", checked && "translate-x-5")}
        />
      </button>
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
    </label>
  );
}

/** Progress bar; fills with scaleX (transform only). */
export function Progress({ value = 0, className, label }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-gray-100", className)} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.div
        className="h-full w-full origin-left rounded-full bg-primary"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: v / 100 }}
        transition={{ duration: dur.slow, ease: easeOut }}
      />
    </div>
  );
}
