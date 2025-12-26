import { useEffect, useState } from "react";
import API_BASE_URL from "../config/api";

function decodeHTML(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

export default function WhoUpdates() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWHOUpdates();
  }, []);

  const fetchWHOUpdates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/who/updates`);

      if (!res.ok) {
        throw new Error("Failed to fetch WHO updates");
      }

      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">🏥 WHO Official Updates</h1>

      <p className="text-gray-600 mb-6">
        Updates and alerts directly from the World Health Organization
      </p>

      {loading && <p className="text-gray-500">Loading WHO updates...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-6">
        {articles.map((article, index) => (
          <div
            key={index}
            className="border rounded-lg p-5 hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              {article.title}
            </h2>

            {/* FIXED DESCRIPTION */}
            <div
              className="text-sm text-gray-700 space-y-3"
              dangerouslySetInnerHTML={{
                __html: decodeHTML(article.description),
              }}
            />

            <div className="flex justify-between items-center text-xs text-gray-500 mt-4">
              <span>
                {article.publishedAt
                  ? new Date(article.publishedAt).toLocaleDateString()
                  : ""}
              </span>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] font-medium hover:underline"
              >
                Read on WHO →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}