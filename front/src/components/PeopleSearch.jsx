import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config/api";

export default function PeopleSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
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
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // debounce

    return () => clearTimeout(delay);
  }, [query]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder="Search doctors and hospitals"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />

      {results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border max-h-96 overflow-y-auto">
          {results.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              onClick={() => {
                if (item.type === "hospital") {
                  // Navigate to hospital profile if route exists, otherwise profile
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
                      {item.location && ` • ${item.location}`}
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