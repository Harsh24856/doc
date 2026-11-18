import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate, useReducedMotion, AnimatePresence } from "motion/react";
import { cn, dur, easeOut, easeIn } from "./cn";

/** Fade + 8px rise when scrolled into view (300ms ease-out, once). */
export function Reveal({ children, delay = 0, className, as = "div" }) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: dur.slow, delay, ease: easeOut }}
    >
      {children}
    </Comp>
  );
}

/** Staggers its <StaggerItem> children into view, 40ms apart. */
export function Stagger({ children, className, as = "div" }) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, as = "div", ...rest }) {
  const Comp = motion[as] ?? motion.div;
  return (
    <Comp
      className={className}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: dur.slow, ease: easeOut } },
      }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/**
 * Number that counts up once when it enters the viewport.
 * This is a data transition, not chrome; it shows the final value at once when reduced motion is on.
 */
export function CountUp({ to = 0, prefix = "", suffix = "", className, decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const target = Number(to) || 0;
  const [val, setVal] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(target);
      return;
    }
    const controls = animate(0, target, { duration: 0.9, ease: easeOut, onUpdate: setVal });
    return () => controls.stop();
  }, [inView, target, reduce]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {val.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** Words that cycle with a short vertical slide (hero copy only). */
export function RotatingWords({ words, interval = 2800, className }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval, reduce]);
  return (
    <span className={cn("relative inline-grid overflow-hidden align-bottom", className)}>
      <span className="sr-only">{words.join(", ")}</span>
      {words.map((w, idx) => (
        <motion.span
          key={w}
          aria-hidden
          className="col-start-1 row-start-1"
          initial={false}
          animate={{ y: idx === i ? "0%" : "100%", opacity: idx === i ? 1 : 0 }}
          transition={{ duration: dur.slow, ease: easeOut }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  );
}

/** Collapsible region: mounts/unmounts with opacity + 4px translate (no height animation). */
export function Collapse({ open, children, className }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className={className}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0, transition: { duration: dur.base, ease: easeOut } }}
          exit={{ opacity: 0, y: -4, transition: { duration: dur.quick, ease: easeIn } }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Words: headline reveal. Each word rises out of its own mask, 40ms apart (300ms each).
 * `from` offsets the stagger so multi-line headlines continue the sequence.
 */
export function Words({ text, from = 0, className, trigger = "view" }) {
  const words = String(text).split(" ");
  const props =
    trigger === "view"
      ? { initial: "hidden", whileInView: "show", viewport: { once: true, margin: "-40px" } }
      : { initial: "hidden", animate: "show" };
  return (
    <motion.span className={cn("block", className)} {...props} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.06em] -mb-[0.06em] align-top">
          <motion.span
            className="inline-block"
            variants={{
              hidden: { y: "110%", opacity: 0 },
              show: { y: 0, opacity: 1, transition: { duration: dur.slow, ease: easeOut, delay: (from + i) * 0.04 } },
            }}
          >
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Numbered section head:  01 — Title ─────────── META */
export function SectionHead({ n, title, meta, className }) {
  return (
    <Reveal className={cn("ds-sec-head", className)}>
      <span className="ds-label">
        <b>{n}</b> — {title}
      </span>
      <span className="ds-rule" />
      {meta && <span className="ds-label hidden sm:inline">{meta}</span>}
    </Reveal>
  );
}
