import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "./cn";
import Icon from "./Icon";
import Spinner from "./Spinner";

/*
 * Variants. Every variant carries a `fill` layer that slides up from the bottom
 * on hover (transform only, 300ms ease-out) — the signature CTA interaction.
 */
const variants = {
  primary: {
    base: "bg-primary text-white border border-gray-900 shadow-[var(--shadow-hard)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-hard-lg)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_var(--color-gray-900)]",
    fill: "bg-gray-900",
  },
  secondary: {
    base: "bg-white text-gray-900 border border-gray-900 shadow-[var(--shadow-hard)] hover:-translate-y-0.5 hover:text-white hover:shadow-[var(--shadow-hard-lg)] active:translate-x-px active:translate-y-px active:shadow-[1px_1px_0_var(--color-gray-900)]",
    fill: "bg-gray-900",
  },
  outline: {
    base: "bg-white text-gray-800 border border-gray-300 hover:border-gray-900 hover:text-white",
    fill: "bg-gray-900",
  },
  soft: { base: "bg-coral-50 text-coral-700 border border-coral-200 hover:text-white hover:border-coral-500", fill: "bg-primary" },
  ghost: { base: "text-gray-700 border border-transparent hover:bg-gray-100", fill: null },
  inverse: { base: "bg-white text-gray-900 border border-white hover:text-white", fill: "bg-gray-900" },
  danger: { base: "bg-coral-700 text-white border border-coral-800 hover:border-gray-900", fill: "bg-gray-900" },
  success: { base: "bg-emerald-600 text-white border border-emerald-700 hover:border-gray-900", fill: "bg-gray-900" },
};

const sizes = {
  sm: "h-9 px-3.5 gap-2 text-[11px]",
  md: "h-11 px-5 gap-2.5 text-[12px]",
  lg: "h-[52px] px-7 gap-3 text-[12px]",
  icon: "h-10 w-10 !px-0",
};

/**
 * Button — mono caps label, hard offset shadow, fill-slide hover, 1px press.
 * `to` renders a router Link, `href` renders an <a>. `loading` shows a spinner.
 */
const Button = forwardRef(function Button(
  { variant = "primary", size = "md", icon, iconRight, loading = false, disabled, className, children, to, href, type = "button", ...rest },
  ref
) {
  const v = variants[variant] ?? variants.primary;
  const inactive = disabled || loading;

  const classes = cn(
    "group/btn relative isolate inline-flex select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-[var(--radius-control)]",
    "font-mono font-bold uppercase tracking-[0.12em]",
    "transition-[transform,box-shadow,color,border-color,background-color] duration-200 ease-[var(--ease-out)]",
    "disabled:pointer-events-none disabled:opacity-50",
    v.base,
    sizes[size],
    className
  );

  const content = (
    <>
      {v.fill && (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10 translate-y-[101%] transition-transform duration-300 ease-[var(--ease-out)] group-hover/btn:translate-y-0",
            v.fill
          )}
        />
      )}
      {loading ? <Spinner className="h-4 w-4" /> : icon && <Icon name={icon} className="text-[18px]" />}
      {children != null && children !== false && <span>{children}</span>}
      {iconRight && !loading && (
        <Icon name={iconRight} className="text-[18px] transition-transform duration-200 group-hover/btn:translate-x-0.5" />
      )}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} aria-disabled={inactive || undefined} {...rest}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} disabled={inactive} aria-busy={loading || undefined} className={classes} {...rest}>
      {content}
    </button>
  );
});

export default Button;

/**
 * ArrowLink — mono caps text + a round arrow badge that fills coral and
 * nudges the arrow up-right on hover.
 */
export function ArrowLink({ to, href, children, className, ...rest }) {
  const Comp = to ? Link : "a";
  const props = to ? { to } : { href };
  return (
    <Comp
      {...props}
      className={cn("group/al inline-flex items-center gap-3 font-mono text-[12px] font-medium uppercase tracking-[0.14em] text-gray-900", className)}
      {...rest}
    >
      <span>{children}</span>
      <span className="grid h-9 w-9 place-items-center rounded-full border border-gray-300 transition-colors duration-300 group-hover/al:border-primary group-hover/al:bg-primary group-hover/al:text-white">
        <Icon name="arrow_outward" className="text-[18px] transition-transform duration-300 ease-[var(--ease-out)] group-hover/al:-translate-y-0.5 group-hover/al:translate-x-0.5" />
      </span>
    </Comp>
  );
}
