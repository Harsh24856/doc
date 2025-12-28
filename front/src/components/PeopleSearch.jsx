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
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Search doctors, hospitals, or cities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
          className="w-full pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm hover:bg-white hover:border-gray-300 text-sm sm:text-base"
        />
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
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
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] flex items-center justify-center text-white text-lg shrink-0">
                  {item.type === "hospital" ? (
                    <span className="material-symbols-outlined text-xl">local_hospital</span>
                  ) : (
                    <span className="material-symbols-outlined text-xl">person</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {item.name}
                  </p>
                  {item.type === "user" && (
                    <p className="text-sm text-gray-600 truncate">
                      {item.designation || "Doctor"} • {item.specialization || "Medical"}
                    </p>
                  )}
                  {item.type === "hospital" && (
                    <p className="text-sm text-gray-600 truncate">
                      {item.hospital_type || "Hospital"}
                      {item.location && (
                        <span className="ml-2 text-[var(--color-primary)] font-medium">
                          <span className="material-symbols-outlined text-sm align-middle">location_on</span> {item.location}
                        </span>
                      )}
                    </p>
                  )}
                  {item.type === "user" && item.hospital_affiliation && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Affiliated with: {item.hospital_affiliation}
                    </p>
                  )}
                </div>
                <span className="material-symbols-outlined text-gray-400 shrink-0">chevron_right</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute left-4 top-full mt-2 text-sm text-gray-500 flex items-center gap-2">
          <span className="material-symbols-outlined text-base animate-spin">hourglass_empty</span>
          Searching...
        </div>
      )}
    </div>
  );
}
