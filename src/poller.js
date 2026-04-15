const Parser = require("rss-parser");
const { TRADE_SOURCES, SCHOOL_SOURCES } = require("./sources");
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

async function fetchFeed(source, sourceSport = null) {
  try {
    const feed = await parser.parseURL(source.url);
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
        sport: detectSport(title, desc, sourceSport),
        isHire: isHire(title, desc),
      });
    }
    return { ok: true, count: stories.length, stories };
  } catch (err) {
    return { ok: false, count: 0, stories: [], error: err.message };
  }
}

async function runInBatches(sources, batchSize, delayMs) {
  const results = [];
  for (let i = 0; i < sources.length; i += batchSize) {
    const batch = sources.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(s => fetchFeed(s, s.sport)));
    results.push(...batchResults);
    if (i + batchSize < sources.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return results;
}

async function pollAll() {
  console.log("[poller] Starting full poll…");
  const start = Date.now();
  const allStories = [];
  let tradeResponded = 0;
  let schoolsResponded = 0;

  // Trade sources — small batch, fast
  console.log(`[poller] Polling ${TRADE_SOURCES.length} trade sources…`);
  const tradeResults = await runInBatches(TRADE_SOURCES, 5, 1000);
  for (let i = 0; i < tradeResults.length; i++) {
    const result = tradeResults[i];
    if (result.status === "fulfilled" && result.value.ok) {
      tradeResponded++;
      allStories.push(...result.value.stories);
    }
  }
  console.log(`[poller] Trade: ${tradeResponded}/${TRADE_SOURCES.length} responded, ${allStories.length} stories`);

  // School sources — small batches with generous delays to stay within memory
  console.log(`[poller] Polling ${SCHOOL_SOURCES.length} school RSS paths…`);
  const schoolResults = await runInBatches(SCHOOL_SOURCES, 5, 1500);

  // Deduplicate — only keep first successful result per school
  const seenSchools = new Set();
  for (let i = 0; i < schoolResults.length; i++) {
    const result = schoolResults[i];
    const source = SCHOOL_SOURCES[i];
    if (result.status === "fulfilled" && result.value.ok && result.value.count > 0) {
      if (!seenSchools.has(source.school)) {
        seenSchools.add(source.school);
        schoolsResponded++;
        allStories.push(...result.value.stories);
      }
    }
  }
  console.log(`[poller] Schools: ${schoolsResponded} responded with stories`);

  // Deduplicate stories by link
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
      totalSources: TRADE_SOURCES.length + SCHOOL_SOURCES.length / 6,
      sourcesResponded: tradeResponded + schoolsResponded,
      tradeResponded,
      schoolsResponded,
      totalStories: deduped.length,
      lastPollDuration: parseFloat(duration),
    },
  };

  console.log(`[poller] Done in ${duration}s — ${deduped.length} unique stories cached`);
}

function getCache() {
  return cache;
}

module.exports = { pollAll, getCache };
