import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Icon from "./Icon";
import { cn, dur, easeIn, easeOut } from "./cn";

const ToastCtx = createContext(null);

const tone = {
  success: { icon: "check_circle", cls: "text-emerald-600" },
  error: { icon: "error", cls: "text-coral-600" },
  info: { icon: "info", cls: "text-indigo-600" },
  warning: { icon: "warning", cls: "text-amber-600" },
};

/**
 * ToastProvider + useToast(): replaces window.alert.
 * Toasts stack bottom-right, enter 200ms ease-out, leave 150ms ease-in,
 * can be swiped away, and show a countdown bar until they auto-dismiss.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, message, type, duration }]);
      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      show: push,
      success: (m, d) => push(m, "success", d),
      error: (m, d) => push(m, "error", d),
      info: (m, d) => push(m, "info", d),
      warning: (m, d) => push(m, "warning", d),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:pr-6">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => Math.abs(info.offset.x) > 80 && dismiss(t.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, transition: { duration: dur.base, ease: easeOut } }}
              exit={{ opacity: 0, transition: { duration: dur.quick, ease: easeIn } }}
              className="pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white p-3.5 pr-11 shadow-[var(--shadow-lift)]"
              role={t.type === "error" ? "alert" : "status"}
            >
              <div className="flex items-start gap-3">
                <Icon name={tone[t.type].icon} fill className={cn("text-[22px]", tone[t.type].cls)} />
                <p className="pt-0.5 text-sm font-medium text-gray-800">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Dismiss notification"
              >
                <Icon name="close" className="text-[18px]" />
              </button>
              {/* Countdown: functional, transform-only. */}
              <motion.span
                className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-coral-400"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: t.duration / 1000, ease: "linear" }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  const fallback = (m) => window.alert(m);
  return ctx ?? { show: fallback, success: fallback, error: fallback, info: fallback, warning: fallback };
}
