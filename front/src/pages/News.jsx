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
    <div className="min-h-screen bg-[var(--color-secondary)] py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
           <h1 className="text-4xl font-bold text-gray-900 mb-3">Medical News 📰</h1>
           <p className="text-gray-500">Latest updates from the healthcare world</p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto flex gap-3 mb-12">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics (e.g. cardiology, vaccine)..."
            className="flex-1 px-5 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent shadow-sm"
          />
          <button
            onClick={resetAndFetch}
            className="bg-[var(--color-primary)] text-white px-8 py-3 rounded-full font-semibold hover:bg-[var(--color-primary-dark)] transition shadow-md hover:shadow-lg"
          >
            Search
          </button>
        </div>

        {/* News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article, index) => (
            <div
              key={`${article.url}-${index}`}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col"
            >
              {article.image ? (
                <div className="h-52 w-full overflow-hidden">
                   <img
                    src={article.image}
                    alt={article.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
              ) : (
                <div className="h-52 w-full bg-gray-100 flex items-center justify-center text-4xl">
                   📰
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between text-xs text-gray-400 mb-3 uppercase font-semibold tracking-wider">
                  <span>{article.source || "News"}</span>
                  <span>
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>

                <h2 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-[var(--color-primary)] transition">
                  {article.title}
                </h2>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1 leading-relaxed">
                  {article.description || "No description available."}
                </p>

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-[var(--color-primary)] text-sm font-semibold hover:underline mt-auto"
                >
                  Read full article <span className="ml-1 text-lg">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
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