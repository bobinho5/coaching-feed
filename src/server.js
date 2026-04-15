const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const path = require("path");
const { pollAll, getCache } = require("./poller");

const app = express();
const PORT = process.env.PORT || 3000;
const POLL_INTERVAL_HOURS = parseInt(process.env.POLL_INTERVAL_HOURS || "4");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/api/feed", (req, res) => {
  const cache = getCache();
  if (!cache.lastUpdated) {
    return res.status(503).json({ error: "Feed not yet populated. Try again in a moment." });
  }

  let { sport = "all", type = "all", source = "all", limit = 100, since } = req.query;
  limit = Math.min(parseInt(limit) || 100, 500);

  let stories = cache.stories;

  if (sport !== "all") stories = stories.filter(s => s.sport === sport);
  if (type === "hire") stories = stories.filter(s => s.isHire);
  else if (type === "departure") stories = stories.filter(s => !s.isHire);
  if (source === "trade") stories = stories.filter(s => s.sourceType === "trade");
  else if (source === "school") stories = stories.filter(s => s.sourceType === "school");
  if (since) {
    const sinceDate = new Date(since);
    if (!isNaN(sinceDate)) stories = stories.filter(s => new Date(s.date) > sinceDate);
  }

  res.json({
    stories: stories.slice(0, limit),
    total: stories.length,
    lastUpdated: cache.lastUpdated,
    stats: cache.stats,
  });
});

app.get("/api/stats", (req, res) => {
  const cache = getCache();
  res.json({ lastUpdated: cache.lastUpdated, stats: cache.stats });
});

app.post("/api/refresh", async (req, res) => {
  const token = req.headers["x-refresh-token"] || req.query.token;
  if (process.env.REFRESH_TOKEN && token !== process.env.REFRESH_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ message: "Refresh triggered — check /api/stats in ~60s" });
  pollAll().catch(console.error);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, async () => {
  console.log(`[server] Coaching feed running on port ${PORT}`);
  console.log(`[server] Poll interval: every ${POLL_INTERVAL_HOURS} hours`);
  console.log("[server] Running initial poll…");
  try {
    await pollAll();
  } catch (err) {
    console.error("[server] Initial poll failed:", err.message);
  }
  const cronExpression = `0 */${POLL_INTERVAL_HOURS} * * *`;
  cron.schedule(cronExpression, () => {
    console.log("[cron] Scheduled poll starting…");
    pollAll().catch(err => console.error("[cron] Poll failed:", err.message));
  });
  console.log(`[server] Next scheduled poll: ${cronExpression}`);
});

module.exports = app;
