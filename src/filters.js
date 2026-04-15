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
  "elevated to",
  "promoted to head coach",
  "takes over as",
  "to lead ",
  "to coach ",
  "as next head coach",
  "as its head coach",
  "as the head coach",
  "head coaching position",
  "head coaching job",
  "head coaching vacancy",
];

const DEPARTURE_KEYWORDS = [
  "steps down",
  "stepping down",
  "resigns as head coach",
  "resigned as head coach",
  "fired as head coach",
  "dismissed as head coach",
  "parts ways",
  "parting ways",
  "coaching change",
  "coaching vacancy",
  "search for new",
  "interim head coach",
  "interim coach",
  "coaching search",
  "let go",
  "not returning",
  "will not return",
  "contract not renewed",
  "mutual agreement",
  "leaving the program",
  "departure",
  "stepping aside",
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
  return ALL_COACHING_KEYWORDS.some(kw => text.includes(kw));
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
