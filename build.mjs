import fs from 'node:fs/promises';

// ─── EDIT THESE TO CHANGE YOUR DAILY PODCAST ───
const CONFIG = {
  length: 'long',                          // 'short' (10 min) | 'medium' (20 min) | 'long' (30 min)
  tone:   'calm',                          // 'classic' (Classic Radio) | 'hot' (Hot Take) | 'calm' (Analytical)
  model:  'claude-sonnet-4-20250514',      // budget option. Change to 'claude-opus-4-7' for higher quality at ~5x cost.
};
// ────────────────────────────────────────────────

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const date = today.toISOString().slice(0, 10);
const longDate = today.toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
});
const longYesterday = yesterday.toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
});
const monthDay = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
const monthDayYesterday = yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
const fullYesterday = yesterday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

const LENGTH = {
  short:  'a ten-minute show, minimum 1400 words and ideally 1600',
  medium: 'a twenty-minute show, minimum 2800 words and ideally 3100',
  long:   'a thirty-minute show, minimum 4200 words and ideally 4500',
}[CONFIG.length];

const TONE = {
  classic: 'Veteran Philadelphia sports radio host — warm, confident, knowledgeable. The smart best-of-WIP voice without the screaming.',
  hot:     'Opinionated Philly sports columnist energy. Strong takes, more edge, still fair. Think Marcus Hayes or old-school Bill Conlin — willing to call things out.',
  calm:    'The Athletic-style analytical voice. Measured, data-aware, thoughtful. Less reaction, more context and pattern.',
}[CONFIG.tone];

const prompt = `You are a sports podcast host producing today's daily show for Ryan, a Philadelphia sports fan.

DATE CONTEXT:
- Today is ${longDate}
- Yesterday was ${longYesterday}
- "Last night" means games and news from yesterday evening (${monthDayYesterday})

YOU HAVE TWO TOOLS:
- web_search: returns search results (titles, URLs, snippets). Use this to find URLs.
- web_fetch: retrieves the FULL CONTENT of a URL. Use this to actually read scoreboard pages and key articles. Snippets often miss scores or specific details — fetching gets you the real data.

═══════════════════════════════════════════════════════════════
STEP ZERO — MANDATORY GAME RESULT VERIFICATION
═══════════════════════════════════════════════════════════════

Before you write a single sentence of this script, you MUST complete this verification using BOTH tools. Missing a game result that happened last night is the cardinal failure of this show.

PHASE A — find scoreboard URLs (use web_search):
  1. "MLB scoreboard ${fullYesterday}" — look for an ESPN or MLB.com URL with yesterday's date
  2. "NBA scoreboard ${fullYesterday}" — look for an ESPN or NBA.com URL
  3. "NHL scoreboard ${fullYesterday}" — look for an ESPN or NHL.com URL

PHASE B — fetch the actual scoreboards (use web_fetch):
  4. web_fetch the MLB scoreboard URL — read every game result, especially the Phillies if they're listed
  5. web_fetch the NBA scoreboard URL — read every game result, especially the Sixers
  6. web_fetch the NHL scoreboard URL — read every game result, especially the Flyers

PHASE C — fill out this checklist before proceeding:

  PHILLIES last night: [played and won/lost X-Y vs OPPONENT, with key details from box score] OR [were off / no game scheduled]
  SIXERS  last night: [played and won/lost X-Y vs OPPONENT] OR [were off / season over / no game scheduled]
  FLYERS  last night: [played and won/lost X-Y vs OPPONENT] OR [were off / season over / no game scheduled]
  EAGLES current status: [breaking news from last 24 hours, OR confirmed quiet day in the offseason]

If a Philly team played and you don't have their final score after fetching the scoreboard, run a follow-up search like "Phillies vs [opponent] ${monthDayYesterday} final score" and fetch the resulting recap article. Do not proceed with "unknown" status for any Philly team.

═══════════════════════════════════════════════════════════════
PHASE D — DEEP CONTEXT (search + fetch on key articles)
═══════════════════════════════════════════════════════════════

Once you have game status confirmed, dig into each Philly team. The pattern is the same: search to find the URL, then fetch the most authoritative article in full.

For each Philly team, run a search like:
  • "Phillies this morning" OR "Phillies ${monthDay} Inquirer" OR "Phillies NBC Sports Philly"
  • "Eagles news this morning ${monthDay}"
  • "Sixers news today ${monthDay}"
  • "Flyers news today ${monthDay}"

When a search surfaces a fresh, authoritative article (Inquirer, Athletic, NBC Sports Philly, beat writer column dated today or last night), web_fetch it for full context. Snippets are not enough for the cold open or lead segments — fetch the article.

For the Eagles specifically: NFL is in offseason. Look for post-draft reaction, OTA news, signings, schedule news. Never report mock drafts as current news.

For league coverage:
  • "NBA last night recap"
  • "NFL news today"
  • "MLB last night recap"
  • "NHL last night recap"
For league hits, snippets are usually enough — only fetch articles when there's a major storyline you want to lead the segment with.

═══════════════════════════════════════════════════════════════
THE FRESHNESS DOCTRINE
═══════════════════════════════════════════════════════════════

This is a DAILY podcast. Ryan listened to yesterday's episode. He already heard everything that broke before yesterday morning. Re-reporting yesterday's news is failure.

TIER 1 — LEAD WITH THESE. Last 12 hours:
  • Last night's game results, box scores, standout performances
  • Overnight or this-morning breaking news
  • Beat writer columns published today
  • Press conferences and quotes from last night or this morning
  • Trades, injuries, signings announced after roughly 8 PM yesterday
  • Tonight's game previews (probable pitchers, key matchups)

TIER 2 — INCLUDE ONLY IF THERE IS A NEW DEVELOPMENT TODAY. 12–24 hours old. If the story broke at 2 PM yesterday and nothing has happened since, DROP IT.

TIER 3 — REJECT OUTRIGHT:
  • Anything older than 24 hours with no new development
  • Mock drafts after the draft has happened
  • Pre-game predictions for games already played
  • Preview articles for games whose results we now know
  • Anything Ryan would have heard on yesterday's show

═══════════════════════════════════════════════════════════════
SOURCE QUALITY
═══════════════════════════════════════════════════════════════

PREFER: ESPN, MLB.com, NBA.com, NHL.com, NFL.com, official team sites (for scores and schedule). NBC Sports Philadelphia, The Philadelphia Inquirer, The Athletic, Crossing Broad (for Philly beat reporting). Action Network, Yahoo Sports (for national news). Named beat writers via their team sections.

DOWNRANK: aggregator sites that re-publish stories, fan blogs without sourcing, social-media rumor accounts, generic SEO content farms. If you see the same story across many sources, fetch the most authoritative one and drop the duplicates.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT — spoken-word podcast script for ElevenReader TTS
═══════════════════════════════════════════════════════════════

HARD RULES FOR TTS:
- NO markdown symbols anywhere. No asterisks, pound signs, bullets, numbered lists, brackets, pipes.
- NO section headers. Use spoken transitions: "Alright, let's turn to the Eagles..." "Now over to the Sixers..."
- Use em-dashes sparingly. Paragraph breaks for bigger pauses.
- Write numbers the way a human says them. "Nola threw seven shutout innings" not "7 SO IP."
- Speak in first person. Greet Ryan by name in the open. Sign off warmly in the close.
- ${TONE}

STRUCTURE — ${LENGTH}. TREAT THE LENGTH TARGET AS A HARD MINIMUM. The word range is not a suggestion — if you are under the minimum, you have not done the job. Expand analysis, add context, draw connections.

Per-segment guidance (for the 30-minute target; scale proportionally for shorter):
1. COLD OPEN: 60–100 words. ALWAYS lead with last night's biggest Philly result if any Philly team played. Otherwise lead with the biggest fresh Philly storyline. Tier 1 only.
2. WELCOME: 200–300 words. Greet Ryan, ground the date, preview the top three or four stories.
3. PHILLIES SEGMENT: 800–1000 words. ALWAYS open with last night's game (if they played) — final score, pitching line, standout performances, key moments. Then today's matchup, fresh injuries, roster moves, standings. If they were off last night, say so explicitly and pivot to current beat reporting and tonight's game preview.
4. EAGLES SEGMENT: 800–1000 words. Current reporting only. Today's roster moves, this morning's beat reports, rookie development, OTA updates. Never mock drafts or pre-event speculation.
5. SIXERS SEGMENT: 500–700 words. Open with last night's game if they played — score, performances, takeaways. Then injury reports, front office, trade rumors, current playoff/offseason status.
6. FLYERS SEGMENT: 500–700 words. Open with last night's game if they played — score, performances. Then prospects, trades, injuries, current status.
7. AROUND THE LEAGUES: 600–900 words. Brisk quick-hits from NBA, NFL, MLB, NHL. Heavy focus on last night's biggest results across the league. Weave — don't list.
8. CLOSE: 100–200 words. One reflection connecting the day's threads, warm sign-off to Ryan by name, tease tomorrow.

FINAL CHECKS before outputting:
  (a) Did I report last night's game result for every Philly team that played? If any are missing, go back and verify with web_fetch.
  (b) Is every story from the last 12–24 hours? Drop anything older.
  (c) Is my total word count above the minimum target? If not, expand the thinnest segments.

Output ONLY the script. No preamble, no explanations, no list of sources. Start directly with the cold open.`;

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
    'anthropic-beta': 'web-fetch-2025-09-10',
  },
  body: JSON.stringify({
    model: CONFIG.model,
    max_tokens: 32000,
    messages: [{ role: 'user', content: prompt }],
    tools: [
      { type: 'web_search_20250305', name: 'web_search', max_uses: 25 },
      { type: 'web_fetch_20250910',  name: 'web_fetch',  max_uses: 12 },
    ],
  }),
});

if (!res.ok) {
  const errText = await res.text();
  throw new Error(`API error ${res.status}: ${errText}`);
}

const data = await res.json();
const script = data.content
  .filter(b => b.type === 'text')
  .map(b => b.text).join('\n\n').trim();

// Diagnostic counters
const searchCount = (data.content || []).filter(b => b.type === 'server_tool_use' && b.name === 'web_search').length;
const fetchCount  = (data.content || []).filter(b => b.type === 'server_tool_use' && b.name === 'web_fetch').length;

if (!script) {
  console.error('=== DIAGNOSTIC ===');
  console.error('stop_reason:', data.stop_reason);
  console.error('usage:', JSON.stringify(data.usage));
  console.error('block types:', data.content.map(b => b.type).join(', '));
  console.error('block count:', data.content.length);
  console.error(`searches=${searchCount}, fetches=${fetchCount}`);
  throw new Error(`Empty script. stop_reason=${data.stop_reason}. See diagnostic above.`);
}

const header =
  `Ryan's Sports Podcast — ${longDate}\n` +
  `${'='.repeat(60)}\n\n`;

await fs.mkdir('episodes', { recursive: true });
await fs.writeFile(`episodes/${date}.txt`, header + script);
console.log(`Wrote episodes/${date}.txt — ${script.split(/\s+/).length} words, ${searchCount} searches, ${fetchCount} fetches, model=${CONFIG.model}`);
