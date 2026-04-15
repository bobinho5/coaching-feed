const Parser = require("rss-parser");
const axios = require("axios");
const https = require("https");
const { TRADE_SOURCES } = require("./sources");
const { isCoachingStory, detectSport, isHire } = require("./filters");

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "CoachingFeedBot/1.0" },
  customFields: { item: ["description", "content:encoded"] },
});

let cache = {
  stories: [],
  lastUpdated: null,
  stats: {
    totalSources: 0,
    sourcesResponded: 0,
    tradeResponded: 0,
    schoolsResponded: 0,
    lastPollDuration: 0,
  },
};

function stripHtml(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

function normalizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function fetchFeed(source) {
  try {
    const axiosOptions = {
      timeout: 8000,
      responseType: "text",
      headers: { "User-Agent": "CoachingFeedBot/1.0" },
    };
    if (source.skipSSL) {
      axiosOptions.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
    const response = await axios.get(source.url, axiosOptions);
    const sanitized = response.data.replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, "&amp;");
    const feed = await parser.parseString(sanitized);
    const stories = [];
    for (const item of feed.items || []) {
      const title = item.title || "";
      const desc = stripHtml(item["content:encoded"] || item.description || item.content || "");
      if (!isCoachingStory(title, desc)) continue;
      stories.push({
        id: `${source.id}_${Buffer.from(item.link || title).toString("base64").slice(0, 16)}`,
        title: title.trim(),
        link: item.link || "",
        date: normalizeDate(item.pubDate || item.isoDate),
        description: desc,
        source: source.name,
        sourceId: source.id,
        sourceType: source.type || "trade",
        school: source.school || null,
        domain: source.domain || null,
        sport: detectSport(title, desc, source.sport),
        isHire: isHire(title, desc),
      });
    }
    return { ok: true, count: stories.length, stories };
  } catch (err) {
    return { ok: false, count: 0, stories: [], error: err.message };
  }
}

async function pollAll() {
  console.log("[poller] Starting trade sources poll…");
  const start = Date.now();
  const allStories = [];
  let tradeResponded = 0;

  for (const source of TRADE_SOURCES) {
    const result = await fetchFeed(source);
    if (result.ok) {
      tradeResponded++;
      allStories.push(...result.stories);
      console.log(`[poller] ${source.name}: ${result.count} stories`);
    } else {
      console.log(`[poller] ${source.name}: failed — ${result.error}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const seen = new Set();
  const deduped = allStories.filter(s => {
    const key = s.link || s.title;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) => new Date(b.date) - new Date(a.date));

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  cache = {
    stories: deduped,
    lastUpdated: new Date().toISOString(),
    stats: {
      totalSources: TRADE_SOURCES.length,
      sourcesResponded: tradeResponded,
      tradeResponded,
      schoolsResponded: 0,
      totalStories: deduped.length,
      lastPollDuration: parseFloat(duration),
    },
  };

  console.log(`[poller] Done in ${duration}s — ${deduped.length} stories from ${tradeResponded} trade sources`);
}

function getCache() {
  return cache;
}

module.exports = { pollAll, getCache };
