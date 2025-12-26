import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/**
 * GET /who/updates
 * Fetch official WHO updates (RSS feed)
 */
router.get("/updates", async (req, res) => {
  try {
    const rssUrl = "https://www.who.int/rss-feeds/news-english.xml";

    const response = await fetch(rssUrl);
    const xml = await response.text();

    const articles = parseRSS(xml).slice(0, 10);

    res.json({
      source: "WHO",
      articles,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch WHO updates",
      error: error.message,
    });
  }
});

/**
 * Very safe RSS parser (no regex hell)
 */
function parseRSS(xml) {
  const items = xml.split("<item>").slice(1);

  return items.map((item) => ({
    title: extract(item, "title"),
    description: extract(item, "description"),
    url: extract(item, "link"),
    image: null,
    source: "World Health Organization",
    publishedAt: extract(item, "pubDate"),
  }));
}

function extract(block, tag) {
  const start = `<${tag}>`;
  const end = `</${tag}>`;

  if (!block.includes(start)) return "";

  let value = block.split(start)[1].split(end)[0];

  // Remove CDATA if present
  value = value.replace("<![CDATA[", "").replace("]]>", "");

  return value.trim();
}

export default router;