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
    const url =
      `https://newsdata.io/api/1/latest?` +
      `apikey=${process.env.NEWSDATA_API_KEY}` +
      `&q=${encodeURIComponent(query)}` +
      `&language=en`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("Invalid response from NewsData.io");
    }

    // Limit + normalize
    const articles = data.results.slice(0, limit).map(normalizeArticle);

    res.json({
      source: "newsdata.io",
      articles,
    });
  } catch (error) {
    res.status(500).json({
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