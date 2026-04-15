const HIRE_KEYWORDS = [
  "named head coach",
  "new head coach",
  "hired as head coach",
  "hires head coach",
  "named as coach",
  "named coach",
  "coach hired",
  "announced the hiring",
  "pleased to announce",
  "joins as head coach",
  "will serve as head coach",
  "appointed head coach",
  "named the head coach",
  "introduced as",
  "welcomes new coach",
  "new coaching staff",
  "tabs ",
  "tabbed ",
  "taps ",
  "tapped ",
  "names coach",
  "names new",
  "announces coach",
  "announces hire",
  "elevated to head coach",
  "promoted to head coach",
  "takes over as head coach",
  "to lead the program",
  "as next head coach",
  "as its head coach",
  "as the head coach",
  "head coaching position",
  "head coaching job",
  "head coaching vacancy",
  "named to lead",
  "will lead the",
  "new women's coach",
  "new men's coach",
];

const DEPARTURE_KEYWORDS = [
  "steps down as head coach",
  "stepping down as head coach",
  "resigns as head coach",
  "resigned as head coach",
  "fired as head coach",
  "dismissed as head coach",
  "parts ways with head coach",
  "parting ways with head coach",
  "coaching change",
  "coaching vacancy",
  "search for head coach",
  "interim head coach",
  "interim coach named",
  "coaching search",
  "let go as head coach",
  "not returning as coach",
  "will not return as coach",
  "contract not renewed",
  "mutual agreement to part",
  "leaving the program as coach",
  "stepping aside as coach",
  "head coach departure",
];

// If a story contains ANY of these, it's about a player not a coach — exclude it
const PLAYER_EXCLUSION_KEYWORDS = [
  "transfer portal",
  "has entered the portal",
  "entered the transfer",
  "commits to",
  "committed to",
  "verbal commitment",
  "signs with",
  "signing with",
  "letter of intent",
  "national signing day",
  "recruiting class",
  "scholarship offer",
  "decommits",
  "decommitted",
  "portal entry",
  "nil deal",
  "nil contract",
  "grad transfer",
  "graduate transfer",
  "student-athlete",
  "redshirt",
  "eligibility",
  "drafted by",
  "nfl draft",
  "nba draft",
  "mlb draft",
  "declared for the draft",
  "going pro",
  "turns pro",
];

const ALL_COACHING_KEYWORDS = [...HIRE_KEYWORDS, ...DEPARTURE_KEYWORDS];

const SPORT_PATTERNS = {
  football:     ["football"],
  basketball:   ["basketball", "hoops", "wbb", "mbb", "women's basketball", "men's basketball"],
  baseball:     ["baseball"],
  softball:     ["softball", "fastpitch"],
  soccer:       ["soccer"],
  swimming:     ["swimming", "diving", "swim"],
  track:        ["track and field", "track & field", "cross country", "cross-country"],
  volleyball:   ["volleyball"],
  lacrosse:     ["lacrosse"],
  hockey:       ["hockey", "ice hockey"],
  wrestling:    ["wrestling"],
  rowing:       ["rowing", "crew"],
  gymnastics:   ["gymnastics"],
  tennis:       ["tennis"],
  golf:         ["golf"],
  field_hockey: ["field hockey"],
  other:        [],
};

function isCoachingStory(title = "", description = "") {
  const text = (title + " " + description).toLowerCase();

  // First check — must contain a coaching keyword
  if (!ALL_COACHING_KEYWORDS.some(kw => text.includes(kw))) return false;

  // Second check — exclude if it looks like a player story
  if (PLAYER_EXCLUSION_KEYWORDS.some(kw => text.includes(kw))) return false;

  return true;
}

function detectSport(title = "", description = "", sourceSport = null) {
  if (sourceSport && sourceSport !== "multiple") return sourceSport;
  const text = (title + " " + description).toLowerCase();
  for (const [sport, patterns] of Object.entries(SPORT_PATTERNS)) {
    if (patterns.some(p => text.includes(p))) return sport;
  }
  return "other";
}

function isHire(title = "", description = "") {
  const text = (title + " " + description).toLowerCase();
  return HIRE_KEYWORDS.some(kw => text.includes(kw));
}

module.exports = { isCoachingStory, detectSport, isHire, ALL_COACHING_KEYWORDS };
