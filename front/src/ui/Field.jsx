import { forwardRef, useId, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn, enter, exit } from "./cn";
import Icon from "./Icon";

const control =
  "peer h-11 w-full rounded-[var(--radius-control)] border border-gray-300 bg-white px-3.5 text-[15px] text-gray-900 placeholder:text-gray-400 " +
  "transition-[border-color,box-shadow] duration-150 hover:border-gray-400";

/** Mono-caps label above the control, with an optional trailing slot (e.g. "Forgot?"). */
function Label({ htmlFor, children, aside }) {
  if (!children && !aside) return null;
  return (
    <div className="mb-1.5 flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="ds-label">
        {children}
      </label>
      {aside}
    </div>
  );
}

/**
 * Field — label + input. Icons inside only when functional:
 * `search` adds a magnifier, `onClear` a clear button, passwords a show/hide toggle.
 */
export const Field = forwardRef(function Field(
  { label, labelAside, error, hint, type = "text", search = false, onClear, className, inputClassName, ...rest },
  ref
) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const showClear = !isPassword && onClear && rest.value;

  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={id} aside={labelAside}>
        {label}
      </Label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword && reveal ? "text" : type}
          aria-invalid={!!error || undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          className={cn(control, search && "pl-10", (isPassword || showClear) && "pr-11", error && "!border-coral-600", inputClassName)}
          {...rest}
        />
        {search && (
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400 peer-focus:text-coral-500" />
        )}
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((r) => !r)}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded text-gray-500 transition-colors duration-150 hover:text-gray-900"
            aria-label={reveal ? "Hide password" : "Show password"}
          >
            <Icon name={reveal ? "visibility_off" : "visibility"} className="text-[19px]" />
          </button>
        )}
        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded text-gray-500 hover:text-gray-900"
            aria-label="Clear"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        )}
      </div>
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </div>
  );
});

export const SelectField = forwardRef(function SelectField({ label, error, hint, className, children, ...rest }, ref) {
  const id = useId();
  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select ref={ref} id={id} aria-invalid={!!error || undefined} className={cn(control, "cursor-pointer appearance-none pr-10", error && "!border-coral-600")} {...rest}>
          {children}
        </select>
        <Icon name="expand_more" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 peer-focus:rotate-180" />
      </div>
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </div>
  );
});

export const TextArea = forwardRef(function TextArea({ label, error, hint, className, rows = 4, ...rest }, ref) {
  const id = useId();
  return (
    <div className={cn("w-full", className)}>
      <Label htmlFor={id}>{label}</Label>
      <textarea ref={ref} id={id} rows={rows} className={cn("ds-input resize-y leading-relaxed", error && "!border-coral-600")} {...rest} />
      <FieldMessage id={`${id}-msg`} error={error} hint={hint} />
    </div>
  );
});

function FieldMessage({ id, error, hint }) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {error ? (
        <motion.p
          key="err"
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0, transition: enter }}
          exit={{ opacity: 0, y: -4, transition: exit }}
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-coral-700"
        >
          <Icon name="error" className="text-sm" /> {error}
        </motion.p>
      ) : hint ? (
        <p key="hint" id={id} className="mt-1.5 text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </AnimatePresence>
  );
}
