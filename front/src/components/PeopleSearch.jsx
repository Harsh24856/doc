import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function PeopleSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/search/users?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setResults(data);
        setShowResults(data.length > 0);
      } catch {
        setResults([]);
        setShowResults(false);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(delay);
  }, [query]);

  /* =========================
     CLICK OUTSIDE TO CLOSE
     ========================= */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResults]);

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg sm:text-xl pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Search doctors, hospitals..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-2.5 md:py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm hover:bg-white hover:border-gray-300 text-sm sm:text-base"
        />
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-white rounded-lg sm:rounded-xl shadow-2xl border border-gray-200 max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto">
          {results.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => {
                setShowResults(false);
                setQuery("");
                if (item.type === "hospital") {
                  navigate(`/profile/${item.id}`);
                } else {
                  navigate(`/profile/${item.id}`);
                }
              }}
              className="px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 active:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors touch-manipulation"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white shrink-0">
                  {item.type === "hospital" ? (
                    <span className="material-symbols-outlined text-base sm:text-lg md:text-xl">local_hospital</span>
                  ) : (
                    <span className="material-symbols-outlined text-base sm:text-lg md:text-xl">person</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                    {item.name}
                  </p>
                  {item.type === "user" && (
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {item.designation || "Doctor"} • {item.specialization || "Medical"}
                    </p>
                  )}
                  {item.type === "hospital" && (
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {item.hospital_type || "Hospital"}
                      {item.location && (
                        <span className="ml-1 sm:ml-2 text-[var(--color-primary)] font-medium">
                          <span className="material-symbols-outlined text-xs sm:text-sm align-middle">location_on</span> {item.location}
                        </span>
                      )}
                    </p>
                  )}
                  {item.type === "user" && item.hospital_affiliation && (
                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">
                      Affiliated with: {item.hospital_affiliation}
                    </p>
                  )}
                </div>
                <span className="material-symbols-outlined text-gray-400 shrink-0 text-base sm:text-lg">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute left-3 sm:left-4 top-full mt-2 text-xs sm:text-sm text-gray-500 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm sm:text-base animate-spin">hourglass_empty</span>
          Searching...
        </div>
      )}
    </div>
  );
}
