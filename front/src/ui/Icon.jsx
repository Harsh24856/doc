import { cn } from "./cn";

/** Material Symbols wrapper. Decorative by default (aria-hidden). */
export default function Icon({ name, fill = false, className, label, ...rest }) {
  return (
    <span
      className={cn("material-symbols-rounded shrink-0", fill && "icon-fill", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...rest}
    >
      {name}
    </span>
  );
}
