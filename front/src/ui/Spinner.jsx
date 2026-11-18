import { cn } from "./cn";

/** Spinner: a functional loop (conveys ongoing work). */
export default function Spinner({ className, label = "Loading" }) {
  return (
    <svg className={cn("h-5 w-5 animate-spin", className)} viewBox="0 0 24 24" fill="none" role="status" aria-label={label}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Full-area loader for a page's first fetch. */
export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-gray-500">
      <Spinner className="h-7 w-7 text-coral-500" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
