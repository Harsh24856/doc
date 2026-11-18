import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { cn, dur, easeIn, easeOut } from "./cn";
import Icon from "./Icon";

/**
 * Modal: opaque panel on a scrim (no blur). Enters 200ms ease-out with an 8px rise,
 * exits 150ms ease-in. Escape closes, Tab is trapped, focus is restored.
 * On phones it becomes a bottom sheet.
 */
export default function Modal({ open, onClose, title, subtitle, icon, children, footer, size = "md", className }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => panelRef.current?.focus(), 20);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  const width = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" }[size];

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: dur.base, ease: easeOut } }}
          exit={{ opacity: 0, transition: { duration: dur.quick, ease: easeIn } }}
        >
          <div className="absolute inset-0 bg-gray-900/50" onClick={onClose} aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === "string" ? title : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { duration: dur.base, ease: easeOut } }}
            exit={{ opacity: 0, y: 8, transition: { duration: dur.quick, ease: easeIn } }}
            className={cn(
              "relative flex max-h-[92vh] w-full flex-col overflow-hidden border border-gray-200 bg-white shadow-2xl outline-none",
              "rounded-t-3xl sm:rounded-3xl",
              width,
              className
            )}
          >
            {(title || icon) && (
              <div className="flex items-start gap-3 border-b border-gray-200 px-6 py-5">
                {icon && (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">
                    <Icon name={icon} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{title}</h2>
                  {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-800"
                  aria-label="Close"
                >
                  <Icon name="close" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
