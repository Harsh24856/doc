/** Tiny className joiner: cn("a", cond && "b", ["c"]) */
export function cn(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ");
}

/**
 * Motion tokens: the only timings the UI uses.
 * Durations: 100 / 150 / 200 / 300ms. Enter = ease-out, exit = ease-in.
 * No spring overshoot, bounce or elastic curves on product chrome.
 */
export const easeOut = [0.16, 1, 0.3, 1];
export const easeIn = [0.7, 0, 0.84, 0];
export const dur = { fast: 0.1, quick: 0.15, base: 0.2, slow: 0.3 };
export const enter = { duration: dur.base, ease: easeOut };
export const exit = { duration: dur.quick, ease: easeIn };
