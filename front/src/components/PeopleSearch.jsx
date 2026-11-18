import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import API_BASE_URL from "../config/api";
import { Icon, Spinner, cn, dur, easeIn, easeOut } from "../ui";

/**
 * Global people search with debounced results, keyboard navigation
 * (↑ ↓ Enter Esc), "/" to focus, and an animated results popover.
 */
export default function PeopleSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [active, setActive] = useState(-1);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/search/users?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/auth");
          throw new Error("Unauthorized");
        }
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setShowResults(true);
        setActive(-1);
      } catch {
        setResults([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(delay);
  }, [query, navigate]);

  useEffect(() => {
    if (!showResults) return;
    const onDown = (e) => searchRef.current && !searchRef.current.contains(e.target) && setShowResults(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showResults]);

  /* "/" focuses search from anywhere */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (item) => {
    setShowResults(false);
    setQuery("");
    navigate(`/profile/${item.id}`);
  };

  const onKeyDown = (e) => {
    if (!showResults || !results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? results.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="group relative">
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400 transition-colors duration-150 group-focus-within:text-coral-500" />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={showResults}
          aria-controls="people-search-results"
          aria-label="Search doctors and hospitals"
          placeholder="Search doctors, hospitals…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:bg-white"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 sm:block">
          {loading ? (
            <Spinner className="h-4 w-4 text-coral-500" />
          ) : (
            !query && <kbd className="rounded-md border border-gray-200 bg-white px-1.5 text-[11px] font-semibold text-gray-400">/</kbd>
          )}
        </span>
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.ul
            id="people-search-results"
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0, transition: { duration: dur.quick, ease: easeOut } }}
            exit={{ opacity: 0, y: -4, transition: { duration: dur.fast, ease: easeIn } }}
            className="absolute z-30 mt-2 max-h-96 w-full min-w-[18rem] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[var(--shadow-lift)]"
          >
            {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-500">No people match “{query}”.</li>}
            {results.map((item, i) => (
              <li
                key={`${item.type}-${item.id}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(item)}
                className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100", i === active ? "bg-gray-100" : "hover:bg-gray-50")}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-600">
                  <Icon name={item.type === "hospital" ? "local_hospital" : "person"} className="text-[20px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="truncate text-xs text-gray-500">
                    {item.type === "hospital"
                      ? [item.hospital_type || "Hospital", item.location].filter(Boolean).join(" · ")
                      : [item.designation || "Doctor", item.specialization || "Medical", item.hospital_affiliation].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Icon name="arrow_forward" className={cn("text-[18px] text-gray-400 transition-transform duration-150", i === active && "translate-x-0.5 text-coral-500")} />
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
