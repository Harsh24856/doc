import { useEffect, useState, useRef } from "react";
import API_BASE_URL from "../config/api";

export default function News() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("medical");

  const observerRef = useRef(null);
  const hasMoreRef = useRef(true);
  const seenUrlsRef = useRef(new Set());

  const LIMIT = 10;

  useEffect(() => {
    resetAndFetch();
    // eslint-disable-next-line
  }, []);

  const resetAndFetch = async () => {
    setArticles([]);
    hasMoreRef.current = true;
    seenUrlsRef.current.clear();
    await fetchNews();
  };

  const fetchNews = async () => {
    if (loading || !hasMoreRef.current) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE_URL}/news/medical?q=${encodeURIComponent(query)}&limit=${LIMIT}`
      );

      if (!res.ok) throw new Error("Failed to fetch news");

      const data = await res.json();
      const newArticles = data.articles || [];

      // Deduplicate using URL
      const uniqueArticles = newArticles.filter((article) => {
        if (!article.url) return false;
        if (seenUrlsRef.current.has(article.url)) return false;

        seenUrlsRef.current.add(article.url);
        return true;
      });

      if (uniqueArticles.length < LIMIT) {
        hasMoreRef.current = false;
      }

      setArticles((prev) => [...prev, ...uniqueArticles]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNews();
        }
      },
      { threshold: 1 }
    );

    const anchor = document.getElementById("scroll-anchor");
    if (anchor) observerRef.current.observe(anchor);

    return () => observerRef.current?.disconnect();
    // eslint-disable-next-line
  }, [articles]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">📰 Medical News</h1>

      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medical news..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={resetAndFetch}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded hover:bg-[var(--color-primary-dark)] transition"
        >
          Search
        </button>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article, index) => (
          <div
            key={`${article.url}-${index}`}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
          >
            {article.image && (
              <img
                src={article.image}
                alt={article.title}
                className="h-48 w-full object-cover"
              />
            )}

            <div className="p-4">
              <h2 className="font-semibold text-lg mb-2 line-clamp-2">
                {article.title}
              </h2>

              <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                {article.description}
              </p>

              <div className="flex justify-between text-xs text-gray-500 mb-3">
                <span>{article.source}</span>
                <span>
                  {article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString()
                    : ""}
                </span>
              </div>

              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-primary)] text-sm font-medium hover:underline"
              >
                Read more →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && (
        <p className="text-center text-gray-500 mt-6">
          Loading more news...
        </p>
      )}

      {error && (
        <p className="text-center text-red-500 mt-6">{error}</p>
      )}

      {/* Scroll anchor */}
      <div id="scroll-anchor" className="h-10"></div>
    </div>
  );
}