import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/**
 * GET /news/medical
 * Query params:
 *  - q (default: medical)
 *  - limit (default: 10)
 */
router.get("/medical", async (req, res) => {
  const query = req.query.q || "medical";
  const limit = Number(req.query.limit) || 10;

  try {
    // Check if API key is configured
    if (!process.env.NEWSDATA_API_KEY) {
      console.error("[News] NEWSDATA_API_KEY is not configured");
      // Return empty articles instead of error to prevent frontend breakage
      return res.json({
        source: "newsdata.io",
        articles: [],
        message: "News API key not configured",
      });
    }

    const url =
      `https://newsdata.io/api/1/latest?` +
      `apikey=${process.env.NEWSDATA_API_KEY}` +
      `&q=${encodeURIComponent(query)}` +
      `&language=en`;

    const response = await fetch(url);
    
    // Try to parse response as JSON first (even for error responses)
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // If JSON parsing fails, try text
      const errorText = await response.text();
      console.error("[News] API Error (non-JSON):", response.status, errorText);
      
      if (response.status === 401 || response.status === 429) {
        return res.json({
          source: "newsdata.io",
          articles: [],
          message: "News API unavailable",
        });
      }
      
      throw new Error(`NewsData.io API error: ${response.status} ${errorText}`);
    }
    
    // Check for API error responses in the JSON (even if HTTP status is 200)
    if (data.status === "error") {
      console.error("[News] API returned error:", JSON.stringify(data));
      const errorMessage = data.results?.message || data.message || "News API error";
      
      // Handle rate limit specifically
      if (response.status === 429 || data.results?.code === "RateLimitExceeded") {
        return res.json({
          source: "newsdata.io",
          articles: [],
          message: "Rate limit exceeded. Please try again later.",
        });
      }
      
      return res.json({
        source: "newsdata.io",
        articles: [],
        message: errorMessage,
      });
    }
    
    // Check for HTTP error status
    if (!response.ok) {
      console.error("[News] API HTTP Error:", response.status, JSON.stringify(data));
      
      // If API key is invalid or quota exceeded, return empty array
      if (response.status === 401 || response.status === 429) {
        const errorMessage = data.results?.message || data.message || "News API unavailable";
        return res.json({
          source: "newsdata.io",
          articles: [],
          message: errorMessage,
        });
      }
      
      throw new Error(`NewsData.io API error: ${response.status} ${JSON.stringify(data)}`);
    }

    if (!data.results || !Array.isArray(data.results)) {
      console.error("[News] Invalid response structure:", data);
      return res.json({
        source: "newsdata.io",
        articles: [],
        message: "Invalid API response",
      });
    }

    // Limit + normalize
    const articles = data.results.slice(0, limit).map(normalizeArticle);

    res.json({
      source: "newsdata.io",
      articles,
    });
  } catch (error) {
    console.error("[News] Error fetching medical news:", error);
    // Return empty array instead of error to prevent frontend breakage
    res.json({
      source: "newsdata.io",
      articles: [],
      message: "Failed to fetch medical news",
      error: error.message,
    });
  }
});

/* Normalize NewsData.io article format */
function normalizeArticle(article) {
  return {
    title: article.title,
    description: article.description || article.content || "",
    url: article.link,
    image: article.image_url || null,
    source: article.source_id || "NewsData",
    publishedAt: article.pubDate,
  };
}

export default router;