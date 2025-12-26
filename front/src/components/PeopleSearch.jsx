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
        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all shadow-sm"
      />

      {showResults && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
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
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="flex items-center gap-2">
                {item.type === "hospital" && (
                  <span className="text-lg">🏥</span>
                )}
                {item.type === "user" && (
                  <span className="text-lg">👤</span>
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {item.name}
                  </p>
                  {item.type === "user" && (
                    <p className="text-sm text-gray-500">
                      {item.designation || "Doctor"} • {item.specialization || "Medical"}
                    </p>
                  )}
                  {item.type === "hospital" && (
                    <p className="text-sm text-gray-500">
                      {item.hospital_type || "Hospital"}
                      {item.location && (
                        <span className="ml-2 text-[var(--color-primary)] font-medium">
                          📍 {item.location}
                        </span>
                      )}
                    </p>
                  )}
                  {item.type === "user" && item.hospital_affiliation && (
                    <p className="text-xs text-gray-400 mt-1">
                      Affiliated with: {item.hospital_affiliation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="absolute mt-1 text-sm text-gray-400">
          Searching...
        </div>
      )}
    </div>
  );
}
