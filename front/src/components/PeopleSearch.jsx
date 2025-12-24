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
        placeholder="Search doctors by name"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
      />

      {results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border">
          {results.map((user) => (
            <div
              key={user.id}
              onClick={() => navigate(`/profile/${user.id}`)}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
            >
              <p className="font-medium text-gray-800">
                {user.name}
              </p>
              <p className="text-sm text-gray-500">
                {user.designation || "Doctor"} • {user.specialization || "Medical"}
              </p>
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