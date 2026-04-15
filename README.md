# Coaching Hire Feed — Setup & Deployment

## What this is
A Node.js backend that:
- Polls 413 college athletic department RSS feeds + 18 trade media sources every 4 hours
- Filters all stories for coaching hire/departure keywords
- Caches results and serves them via a JSON API
- Serves a clean frontend feed UI at the root URL

---

## Local setup (test before deploying)

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start
# or for auto-reload during development:
npm run dev
```

Open http://localhost:3000 — the feed will auto-populate on startup (takes ~60 seconds for first poll).

---

## Deploy to Render.com (free tier, ~10 minutes)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial coaching feed backend"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/coaching-feed.git
git push -u origin main
```

### Step 2 — Create Render service
1. Go to https://render.com and sign up / log in
2. Click **New → Web Service**
3. Connect your GitHub repo
4. Fill in these settings:
   - **Name:** coaching-feed (or whatever you want)
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

### Step 3 — Set environment variables (optional but recommended)
In Render dashboard → your service → Environment:

| Key | Value | Purpose |
|-----|-------|---------|
| `PORT` | `3000` | (Render sets this automatically) |
| `POLL_INTERVAL_HOURS` | `4` | How often to re-scan all sources |
| `REFRESH_TOKEN` | any secret string | Protects manual refresh endpoint |

### Step 4 — Deploy
Click **Create Web Service**. Render will:
1. Pull your code
2. Run `npm install`
3. Run `npm start`
4. Give you a URL like `https://coaching-feed.onrender.com`

Your feed will be live at that URL. The initial poll runs on startup (~60s).

---

## API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | The feed UI |
| `GET /api/feed` | JSON feed of coaching stories |
| `GET /api/stats` | Poll stats and last updated time |
| `POST /api/refresh` | Manually trigger a re-poll |

### /api/feed query parameters

| Param | Options | Default |
|-------|---------|---------|
| `sport` | football, basketball, baseball, softball, soccer, swimming, track, volleyball, lacrosse, hockey, wrestling, rowing, gymnastics, tennis, other, all | all |
| `type` | hire, departure, all | all |
| `source` | trade, school, all | all |
| `limit` | 1–500 | 100 |
| `since` | ISO date string | — |

Example: `GET /api/feed?sport=football&type=hire&limit=50`

---

## Notes on school RSS feeds

Most college athletic sites run on Sidearm Sports platform and serve RSS at `/rss.aspx`.
PrestoSports sites use `/news/rss.xml`. The poller tries both patterns per school.

Roughly 60–75% of schools will respond. Schools on custom platforms or with RSS disabled
will be missed — supplement with the trade media sources which aggregate across all schools.

---

## Adding more sources

Edit `src/sources.js`:
- Add to `TRADE_SOURCES` for trade media (any site with an RSS feed)
- Add to `SCHOOL_DOMAINS` for school athletic sites
