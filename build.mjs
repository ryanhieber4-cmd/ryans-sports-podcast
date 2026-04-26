import fs from 'node:fs/promises';

// ─── EDIT THESE TO CHANGE YOUR DAILY PODCAST ───
const CONFIG = {
  length: 'long',                // 'short' (10 min) | 'medium' (20 min) | 'long' (30 min)
  tone:   'calm',                // 'classic' (Classic Radio) | 'hot' (Hot Take) | 'calm' (Analytical)
  model:  'claude-opus-4-7',     // 'claude-opus-4-7' (recommended) | 'claude-sonnet-4-20250514' (cheaper)
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

const LENGTH_DESC = {
  short:  'a ten-minute show, minimum 1400 words and ideally 1600',
  medium: 'a twenty-minute show, minimum 2800 words and ideally 3100',
  long:   'a thirty-minute show, minimum 4200 words and ideally 4500',
}[CONFIG.length];

const MIN_WORDS = {
  short: 700,
  medium: 1400,
  long: 2100,
}[CONFIG.length];

const TONE = {
  classic: 'Veteran Philadelphia sports radio host — warm, confident, knowledgeable. The smart best-of-WIP voice without the screaming.',
  hot:     'Opinionated Philly sports columnist energy. Strong takes, more edge, still fair. Think Marcus Hayes or old-school Bill Conlin — willing to call things out.',
  calm:    'The Athletic-style analytical voice. Measured, data-aware, thoughtful. Less reaction, more context and pattern.',
}[CONFIG.tone];

const prompt = `You are a sports podcast host producing today's daily show for Ryan, a Philadelphia sports fan.

═══════════════════════════════════════════════════════════════
SILENCE RULE — READ THIS FIRST
═══════════════════════════════════════════════════════════════

Your ENTIRE response is the podcast script. From your very first character to your very last character, the only thing you produce is words a host would speak on air.

Your VERY FIRST PARAGRAPH must be about a sports story — a team, a game, a player, a moment. It cannot describe what you have done, what you need, or what you are about to do.

If your first paragraph mentions any of these, you have failed:
- Your research process ("I have...", "I need...", "I'll search...", "Let me check...")
- Scripts, podcasts, shows ("Now writing the script", "Time to write", "Before I start the show")
- Searches, data, facts, material, info, research, findings
- Plans or transitions between research and writing
- Yourself in any way that breaks the fourth wall

Examples of FORBIDDEN openings (do not write any of these):
  "I have key facts. Now writing the script."
  "I have enough material to write a comprehensive script."
  "I have everything I need."
  "I need the Phillies-Braves result. Let me search."
  "Let me also gather more info."
  "I have abundant material."
  "Based on my research, here's the show."

Examples of GOOD openings:
  "What a difference one night makes."
  "Two hundred and fifty-three days. That's how long Zack Wheeler waited."
  "The streak is dead."
  "Good morning, Ryan."

Run your tool calls silently. When you start producing text, that text IS the show. There is no preamble, no setup, no transition.

═══════════════════════════════════════════════════════════════
PARAPHRASE-ONLY RULE
═══════════════════════════════════════════════════════════════

You will read articles and beat reports in your search results. NEVER copy their text into your script. Write everything in your own host voice.

NEVER include in your script:
- Bullet-separator lists ("Eagles · Flyers · Sixers · Phillies")
- Date stamps from articles ("April 26, 2026 · By Jimmy Kempski")
- Social media handles ("— Nathan Ackerman (@NathanAckerman_) April 26, 2026")
- Headlines or article slugs ("PHI@PIT, Gm 2: Vladar makes 27 saves")
- Hashtags or "#Eagles" tags
- Repeated sentences from auto-transcripts (where the same sentence appears twice in a row)
- Promotional fragments ("Read More", "Subscribe", "Watch")
- Box score abbreviations or stat tables in raw form

═══════════════════════════════════════════════════════════════
CONFLICT RESOLUTION — silently
═══════════════════════════════════════════════════════════════

When two sources disagree, pick the most authoritative (ESPN, MLB.com, NBA.com, NHL.com, official team) and use that number. Do NOT write paragraphs in the script reconciling them ("the first quote says X, the second says Y..."). Resolve internally, state the right answer.

═══════════════════════════════════════════════════════════════
DATE CONTEXT
═══════════════════════════════════════════════════════════════
- Today is ${longDate}
- Yesterday was ${longYesterday}
- "Last night" means games and news from yesterday evening (${monthDayYesterday})

═══════════════════════════════════════════════════════════════
RESEARCH PHASE — silent, via tool calls only
═══════════════════════════════════════════════════════════════

Establish these four facts before writing:
  • PHILLIES last night: did they play, final score
  • SIXERS last night: did they play, final score
  • FLYERS last night: did they play, final score
  • EAGLES current status: breaking news in last 24 hours

Run scoreboard searches FIRST:
1. "MLB scoreboard ${fullYesterday}" — Phillies result
2. "NBA scoreboard ${fullYesterday}" — Sixers result
3. "NHL scoreboard ${fullYesterday}" — Flyers result

Follow-ups if a result is unclear:
  • "Phillies vs [opponent] ${monthDayYesterday} final score"
  • "[Team] ${monthDayYesterday} recap" or "[Team] box score ${monthDayYesterday}"

Then deep-dive (silent):
4. "Phillies this morning" OR "Phillies ${monthDay}"
5. "Eagles news this morning" OR "Eagles ${monthDay}"
6. "Sixers ${monthDay}" OR "Sixers news today"
7. "Flyers ${monthDay}" OR "Flyers news today"
8. "NBA last night recap"
9. "NFL news today"
10. "MLB last night recap"
11. "NHL last night recap"

Beat-writer follow-ups when needed: Matt Gelb (Phillies), Jimmy Kempski / Zach Berman (Eagles), Kyle Neubeck (Sixers), Charlie O'Connor (Flyers).

═══════════════════════════════════════════════════════════════
FRESHNESS DOCTRINE
═══════════════════════════════════════════════════════════════

Ryan listened to yesterday's episode. Re-reporting yesterday's news is failure.

LEAD WITH (last 12 hours): last night's results, overnight breaking news, this morning's beat reports.
INCLUDE ONLY IF NEW DEVELOPMENT TODAY (12–24 hours): mid-day yesterday news only with a fresh quote or follow-up today.
REJECT (older than 24 hrs without new development).

═══════════════════════════════════════════════════════════════
SOURCE QUALITY
═══════════════════════════════════════════════════════════════

GAME RESULTS: ESPN, MLB.com, NBA.com, NHL.com, NFL.com, official team sites
PHILLY BEAT: NBC Sports Philadelphia, Inquirer, The Athletic, Crossing Broad
NATIONAL: ESPN, The Athletic, Action Network, Yahoo Sports

IGNORE aggregators, fan blogs without sourcing, social rumor accounts, SEO content.

═══════════════════════════════════════════════════════════════
WRITING PHASE — your only visible output
═══════════════════════════════════════════════════════════════

Spoken-word podcast script for ElevenReader TTS.

HARD RULES FOR TTS:
- NO markdown symbols. No asterisks, pound signs, bullets, numbered lists, brackets, pipes, middle-dots (·).
- NO section headers. Use spoken transitions.
- Use em-dashes sparingly. Paragraph breaks for bigger pauses.
- Write numbers the way a human says them. "Nola threw seven shutout innings" not "7 SO IP."
- First person. Greet Ryan by name in the open. Sign off warmly in the close.
- Do NOT begin paragraphs with leading whitespace. Each paragraph starts at the left margin.
- ${TONE}

STRUCTURE — ${LENGTH_DESC}. The minimum word count is a HARD FLOOR.

Per-segment guidance (for the 30-minute target; scale proportionally):
1. COLD OPEN (60–100 words): Lead with last night's biggest Philly result if any team played.
2. WELCOME (200–300 words): Greet Ryan, ground the date, preview top three or four stories.
3. PHILLIES (800–1000 words): Last night's game first if they played. Then today's matchup, injuries, moves.
4. EAGLES (800–1000 words): Current reporting only.
5. SIXERS (500–700 words): Last night's game first if they played. Then injuries, front office, status.
6. FLYERS (500–700 words): Last night's game first if they played. Then prospects, trades, injuries.
7. AROUND THE LEAGUES (600–900 words): Brisk quick-hits across NBA, NFL, MLB, NHL.
8. CLOSE (100–200 words): One reflection, warm sign-off to Ryan, tease tomorrow.

Start the response with the cold open's first word. End with the close's last word. Nothing else.`;

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: CONFIG.model,
    max_tokens: 32000,
    messages: [{ role: 'user', content: prompt }],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 25 }],
  }),
});

if (!res.ok) {
  const errText = await res.text();
  throw new Error(`API error ${res.status}: ${errText}`);
}

const data = await res.json();
let script = data.content
  .filter(b => b.type === 'text')
  .map(b => b.text).join('\n\n').trim();

if (!script) {
  console.error('=== DIAGNOSTIC ===');
  console.error('stop_reason:', data.stop_reason);
  console.error('usage:', JSON.stringify(data.usage));
  console.error('block types:', data.content.map(b => b.type).join(', '));
  console.error('block count:', data.content.length);
  throw new Error(`Empty script. stop_reason=${data.stop_reason}.`);
}

// ─── POST-PROCESSING ───
// Two-stage cleanup:
// Stage 1: walk paragraphs from top, drop narration paragraphs until we hit real content
// Stage 2: scrub source artifacts and formatting noise throughout

// Stage 1: detect meta-narration paragraphs.
// A paragraph is narration if it talks about the model's process/state rather than
// a sports story. We use a multi-signal check — any single hit drops the paragraph.
function isNarrationParagraph(text) {
  const t = text.trim().toLowerCase();
  if (!t) return true;            // empty paragraphs at top get skipped
  if (t.length > 400) return false; // narration is always short
  if (t.split(/[.!?]+/).filter(s => s.trim()).length > 4) return false; // narration is 1-4 sentences

  // Dead-giveaway phrases
  const phrases = [
    /\bnow writing the script\b/,
    /\bwriting the script\b/,
    /\bbefore (?:i|we) write\b/,
    /\bbefore (?:i|we) start\b/,
    /\bi need (?:to|the|more|further|additional|some|one)\b/,
    /\bi (?:have|'?ve) (?:enough|abundant|everything|all|key|good|sufficient|the)\b/,
    /\b(?:i'?ll|i will) (?:search|look|check|find|gather|verify|confirm|get)\b/,
    /\blet me (?:search|look|check|find|gather|confirm|get|verify|also|now|first)\b/,
    /\b(?:looking|based) (?:at|on) (?:the|my) (?:data|results|searches|findings|research|info)\b/,
    /\btime to write\b/,
    /\bone more (?:bit|search|check|piece|thing|item)\b/,
    /\bgot (?:the|a|enough|abundant|everything)\b/,
    /\bmoving (?:to|on|along|forward)\b/,
    /\bnext (?:up|search|let'?s)\b/,
    /\bnow (?:i'?ll|let me|i will|to)\b/,
    /\bgather (?:more|the|some|additional)\b/,
  ];

  return phrases.some(p => p.test(t));
}

// Walk paragraphs from the top, drop narration ones until we hit real content
const paragraphs = script.split(/\n\s*\n+/);
let firstRealIdx = 0;
let droppedTopParagraphs = 0;
while (firstRealIdx < paragraphs.length && isNarrationParagraph(paragraphs[firstRealIdx])) {
  droppedTopParagraphs++;
  firstRealIdx++;
}
script = paragraphs.slice(firstRealIdx).join('\n\n');

if (droppedTopParagraphs > 0) {
  console.log(`Stripped ${droppedTopParagraphs} narration paragraph(s) from top.`);
}

// Stage 2: scrub source artifacts throughout the body
const SCRUB_PATTERNS = [
  // Social media citation tails like "— Nathan Ackerman (@handle) April 26, 2026"
  /—\s*[A-Z][a-zA-Z]*\s+[A-Z][a-zA-Z]*\s*\(@\w+\)\s+[A-Z][a-z]+\s+\d+,\s+\d{4}/g,
  // Bullet-separator chains (3+ words connected by middle-dots)
  /(?:\b\w+\b\s*·\s*){3,}\b\w+\b/g,
  // Stray "Read More" / "Watch Highlights" / "Subscribe" promotional fragments
  /\b(?:Read More|Watch Highlights|Subscribe (?:to|now)|Sign up|Click here)\b/gi,
  // Hashtags
  /#[A-Za-z][A-Za-z0-9_]+/g,
];

let scrubbedCount = 0;
for (const pat of SCRUB_PATTERNS) {
  const before = script.length;
  script = script.replace(pat, '');
  if (script.length !== before) scrubbedCount++;
}

// Strip any remaining middle-dots — they have no place in spoken text
script = script.replace(/\s*·\s*/g, ' ');

// Trim leading whitespace from each paragraph (fixes the " So when..." artifact)
script = script.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0).join('\n\n');

// Collapse excess inline whitespace
script = script.replace(/[ \t]{2,}/g, ' ');

if (scrubbedCount > 0) {
  console.log(`Scrubbed ${scrubbedCount} pattern group(s) from body.`);
}

// ─── LENGTH SAFETY NET ───
const wordCount = script.split(/\s+/).length;
if (wordCount < MIN_WORDS) {
  console.error('=== SHORT SCRIPT DIAGNOSTIC ===');
  console.error(`Got ${wordCount} words, expected at least ${MIN_WORDS}.`);
  console.error('stop_reason:', data.stop_reason);
  console.error('usage:', JSON.stringify(data.usage));
  console.error('First 500 chars:');
  console.error(script.slice(0, 500));
  throw new Error(`Script too short: ${wordCount} words (minimum ${MIN_WORDS}).`);
}

const header =
  `Ryan's Sports Podcast — ${longDate}\n` +
  `${'='.repeat(60)}\n\n`;

await fs.mkdir('episodes', { recursive: true });
await fs.writeFile(`episodes/${date}.txt`, header + script);
console.log(`Wrote episodes/${date}.txt (${wordCount} words, model=${CONFIG.model})`);
