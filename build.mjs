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

Your ENTIRE response is the podcast script. From your very first character to your very last character, the only thing you are producing is the words a host would speak on air.

There is no other text. None. Not before, not between searches, not before writing, not after writing.

ABSOLUTELY FORBIDDEN — do not output ANY of these, ever:
- "Let me search for..." / "Now I'll look up..." / "I'll check..."
- "Looking at the data..." / "Based on what I found..." / "I can see that..."
- "I have key facts." / "I have enough info." / "I have abundant material."
- "Now writing the script." / "Now I'll write..." / "Time to write the show."
- Status updates between search batches ("Got the Phillies. Moving to Eagles.")
- Checklists, plans, summaries of what you've done so far
- "Here is the script:" / "Below is your podcast:"

If your first word is anything other than the first word of the cold open, you have failed.

The verification of last night's games happens via tool calls only. The model that runs this code in the GitHub Action saves your text output verbatim into a file that gets emailed to the user. ANY narration you emit ends up in his audio podcast and breaks the show. Stay silent. Search. Write. End.

═══════════════════════════════════════════════════════════════
PARAPHRASE-ONLY RULE — never quote source text
═══════════════════════════════════════════════════════════════

You will read articles, box scores, beat reports, and social posts in your search results. NEVER copy their text into your script. You are a host speaking to a listener — write everything in your own words, in spoken English.

NEVER include in your script any of these formatting artifacts pulled from sources:
- Lists with bullet separators ("· Eagles · Flyers · Sixers · Phillies · Fantasy Football")
- Date stamps from articles ("April 26, 2026 · By Jimmy Kempski PhillyVoice Staff")
- Social media handles or post citations ("— Nathan Ackerman (@NathanAckerman_) April 26, 2026")
- Headlines or article slugs ("PHI@PIT, Gm 2: Vladar makes 27 saves...")
- Hashtags, emoji, or "#Eagles" / "#Phillies" tags
- Twitter / X repetitions where the same sentence appears twice in a row (transcripts often do this — fix it before speaking)
- Promotional fragments ("Read More", "Watch Highlights", "Subscribe to The Athletic")
- Box score abbreviations or stat tables in raw form

If you find yourself about to write something that looks copy-pasted, REWRITE it as a single conversational sentence in your own voice. "The Phillies beat the Braves 8-5" is fine. Pasting the box-score header is not.

═══════════════════════════════════════════════════════════════
CONFLICT RESOLUTION — fix it silently, don't show your work
═══════════════════════════════════════════════════════════════

When two sources disagree on a fact (different scores, different stat lines, different injury details), pick the most authoritative source (ESPN, MLB.com, NBA.com, NHL.com, official team) and use that number. Do NOT write paragraphs in the script trying to figure out which one is right ("The first quote says X, the second says Y, my read is..."). The listener doesn't care about your reconciliation — they care about the right answer. Resolve, then state.

═══════════════════════════════════════════════════════════════
DATE CONTEXT
═══════════════════════════════════════════════════════════════
- Today is ${longDate}
- Yesterday was ${longYesterday}
- "Last night" means games and news from yesterday evening (${monthDayYesterday})

═══════════════════════════════════════════════════════════════
RESEARCH PHASE — silent, via tool calls only
═══════════════════════════════════════════════════════════════

Your research must establish these four facts before you write anything:

  • PHILLIES last night: did they play, and if so what was the final score
  • SIXERS  last night: did they play, and if so what was the final score
  • FLYERS  last night: did they play, and if so what was the final score
  • EAGLES  current status: any breaking news in the last 24 hours

Run these scoreboard searches FIRST (silently, via tool calls):

1. "MLB scoreboard ${fullYesterday}" — Phillies result
2. "NBA scoreboard ${fullYesterday}" — Sixers result
3. "NHL scoreboard ${fullYesterday}" — Flyers result

If a scoreboard search does not clearly show a Philly team's result, run a follow-up:
  • "Phillies vs [opponent] ${monthDayYesterday} final score"
  • "[Team] ${monthDayYesterday} recap" or "[Team] box score ${monthDayYesterday}"

Continue searching silently until each Philly team's status is definitively known.

Then run these deep-dive searches (still silent):

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

LEAD WITH (last 12 hours): last night's game results, overnight breaking news, this morning's beat reports, fresh injuries, today's lineups, tonight's matchups.

INCLUDE ONLY IF NEW DEVELOPMENT TODAY (12–24 hours): mid-day news from yesterday only if there's been a fresh quote or follow-up today.

REJECT (older than 24 hrs without new development): mock drafts after the draft, predictions for games already played, anything Ryan would have heard yesterday.

═══════════════════════════════════════════════════════════════
SOURCE QUALITY
═══════════════════════════════════════════════════════════════

GAME RESULTS / SCORES: ESPN, MLB.com, NBA.com, NHL.com, NFL.com, official team sites
PHILLY BEAT: NBC Sports Philadelphia, The Philadelphia Inquirer, The Athletic, Crossing Broad
NATIONAL: ESPN, The Athletic, Action Network, Yahoo Sports

IGNORE aggregator sites, fan blogs without sourcing, social-media rumor accounts, generic SEO content.

═══════════════════════════════════════════════════════════════
WRITING PHASE — your only visible output
═══════════════════════════════════════════════════════════════

Spoken-word podcast script for ElevenReader TTS.

HARD RULES FOR TTS:
- NO markdown symbols. No asterisks, pound signs, bullets, numbered lists, brackets, pipes, middle-dots (·).
- NO section headers. Use spoken transitions: "Alright, let's turn to the Eagles..." "Now over to the Sixers..."
- Use em-dashes sparingly. Paragraph breaks for bigger pauses.
- Write numbers the way a human says them. "Nola threw seven shutout innings" not "7 SO IP."
- First person. Greet Ryan by name in the open. Sign off warmly in the close.
- ${TONE}

STRUCTURE — ${LENGTH_DESC}. The minimum word count is a HARD FLOOR. If you are under it, expand analysis and context until you clear it.

Per-segment guidance (for the 30-minute target; scale proportionally for shorter):
1. COLD OPEN (60–100 words): Lead with last night's biggest Philly result if any team played. Otherwise lead with the biggest Philly storyline.
2. WELCOME (200–300 words): Greet Ryan, ground the date, preview top three or four stories.
3. PHILLIES SEGMENT (800–1000 words): Open with last night's game if they played — final score, pitching line, standout performances. Then today's matchup, fresh injuries, roster moves, standings.
4. EAGLES SEGMENT (800–1000 words): Current reporting only. Today's roster moves, this morning's beat reports, rookie development, OTAs.
5. SIXERS SEGMENT (500–700 words): Open with last night's game if they played. Then injuries, front office, trades, current status.
6. FLYERS SEGMENT (500–700 words): Open with last night's game if they played. Then prospects, trades, injuries.
7. AROUND THE LEAGUES (600–900 words): Brisk quick-hits from NBA, NFL, MLB, NHL — heavy on last night's biggest results. Weave, don't list.
8. CLOSE (100–200 words): One reflection, warm sign-off to Ryan by name, tease tomorrow.

Start the response with the cold open's first word. End the response with the close's last word. Nothing else.`;

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
  throw new Error(`Empty script. stop_reason=${data.stop_reason}. See diagnostic above.`);
}

// ─── POST-PROCESSING: strip narration and source artifacts ───
// Belt-and-suspenders backup for the prompt rules. If anything leaks through,
// these regexes catch the most common offenders before the file gets emailed.

const STRIP_PATTERNS = [
  // Narration / status updates at start of paragraphs
  /^\s*(I have (?:key facts|enough info|abundant material|the data)\.?.*?)$/gim,
  /^\s*(Now (?:writing|I'?ll write|I will write).*?)$/gim,
  /^\s*(Let me (?:search|look up|check|find|gather|confirm).*?)$/gim,
  /^\s*(Looking at (?:the|my) (?:data|results|searches|findings).*?)$/gim,
  /^\s*(Based on (?:my|the) (?:research|findings|searches).*?)$/gim,
  /^\s*(Time to write.*?)$/gim,
  /^\s*(Got (?:the|a) .{1,30}\.\s*(?:Moving|Now|Next).*?)$/gim,

  // Social media citation tails
  /—\s*[A-Z][a-zA-Z]*\s+[A-Z][a-zA-Z]*\s*\(@\w+\)\s+[A-Z][a-z]+\s+\d+,\s+\d{4}/g,

  // Bullet-separator garbage runs (Eagles · Flyers · Sixers · ...)
  /(?:\b\w+\b\s*·\s*){3,}\b\w+\b/g,
];

let stripped = 0;
for (const pat of STRIP_PATTERNS) {
  const before = script.length;
  script = script.replace(pat, '');
  if (script.length !== before) stripped++;
}

// Final cleanup: middle-dot characters never belong in spoken text
script = script.replace(/\s*·\s*/g, ' ');
// Collapse blank lines and excess whitespace created by stripping
script = script.replace(/[ \t]{2,}/g, ' ');
script = script.replace(/\n{3,}/g, '\n\n').trim();

if (stripped > 0) {
  console.log(`Post-processing stripped artifacts in ${stripped} pattern groups.`);
}

// ─── LENGTH SAFETY NET ───
const wordCount = script.split(/\s+/).length;
if (wordCount < MIN_WORDS) {
  console.error('=== SHORT SCRIPT DIAGNOSTIC ===');
  console.error(`Got ${wordCount} words, expected at least ${MIN_WORDS}.`);
  console.error('stop_reason:', data.stop_reason);
  console.error('usage:', JSON.stringify(data.usage));
  console.error('First 500 chars of output:');
  console.error(script.slice(0, 500));
  throw new Error(`Script too short: ${wordCount} words (minimum ${MIN_WORDS}). Build failed so the missed-run alert will fire.`);
}

const header =
  `Ryan's Sports Podcast — ${longDate}\n` +
  `${'='.repeat(60)}\n\n`;

await fs.mkdir('episodes', { recursive: true });
await fs.writeFile(`episodes/${date}.txt`, header + script);
console.log(`Wrote episodes/${date}.txt (${wordCount} words, model=${CONFIG.model})`);
