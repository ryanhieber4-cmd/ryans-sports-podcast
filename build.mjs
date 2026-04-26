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

// Minimum word count — if output is below 50% of this, fail the build loudly
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
SILENCE RULE — READ THIS FIRST. THIS IS THE MOST IMPORTANT INSTRUCTION.
═══════════════════════════════════════════════════════════════

You will conduct extensive research using the web_search tool. During that research, you MUST NOT produce any visible text output.

Your ONLY text output for this entire response is the final podcast script — from cold open through close. Nothing else exists.

DO NOT, under any circumstances:
- Narrate what you are about to search for ("Let me search for...", "Now I'll look up...")
- Summarize what you have found so far ("Looking at the scoreboard data...", "I can see that...")
- Output a checklist, plan, status report, or research notes
- Write preamble like "Here is your podcast" or "Now I'll write the script"
- Confirm the user's request or acknowledge the task

If you catch yourself typing "Let me..." or "Looking at..." or "I'll now..." or "Based on..." — STOP. Just call the next search tool silently, or begin writing the cold open. There is no in-between text.

Run searches. Read results. Then write the script. That is your entire output.

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

Continue searching silently until each Philly team's status is definitively known. A vague article is not confirmation — you need an actual final score or confirmation of no game scheduled.

Then run these deep-dive searches (still silent):

4. "Phillies this morning" OR "Phillies ${monthDay}"
5. "Eagles news this morning" OR "Eagles ${monthDay}"
6. "Sixers ${monthDay}" OR "Sixers news today"
7. "Flyers ${monthDay}" OR "Flyers news today"
8. "NBA last night recap"
9. "NFL news today"
10. "MLB last night recap"
11. "NHL last night recap"

Beat-writer follow-ups when needed: Matt Gelb (Phillies), Jimmy Kempski / Zach Berman (Eagles), Kyle Neubeck (Sixers), Charlie O'Connor (Flyers). Or "Inquirer [team]", "NBC Sports Philly [team]", "The Athletic [team]".

═══════════════════════════════════════════════════════════════
FRESHNESS DOCTRINE
═══════════════════════════════════════════════════════════════

Ryan listened to yesterday's episode. Re-reporting yesterday's news is failure.

LEAD WITH (last 12 hours): last night's game results, overnight breaking news, this morning's beat reports, fresh injuries, today's lineups, tonight's matchups.

INCLUDE ONLY IF NEW DEVELOPMENT TODAY (12–24 hours): mid-day news from yesterday only if there's been a fresh quote, follow-up, or related move today.

REJECT (older than 24 hrs without new development): mock drafts after the draft, predictions for games already played, rumors that have been resolved, anything Ryan would have heard yesterday.

═══════════════════════════════════════════════════════════════
SOURCE QUALITY
═══════════════════════════════════════════════════════════════

GAME RESULTS / SCORES: ESPN, MLB.com, NBA.com, NHL.com, NFL.com, official team sites
PHILLY BEAT: NBC Sports Philadelphia, The Philadelphia Inquirer, The Athletic, Crossing Broad
NATIONAL: ESPN, The Athletic, Action Network, Yahoo Sports

IGNORE aggregator sites, fan blogs without sourcing, social-media rumor accounts, generic SEO content. If the same story appears across many sources, use the most authoritative one.

═══════════════════════════════════════════════════════════════
WRITING PHASE — your only visible output
═══════════════════════════════════════════════════════════════

Spoken-word podcast script for ElevenReader TTS.

HARD RULES FOR TTS:
- NO markdown symbols. No asterisks, pound signs, bullets, numbered lists, brackets, pipes.
- NO section headers. Use spoken transitions: "Alright, let's turn to the Eagles..." "Now over to the Sixers..."
- Use em-dashes sparingly. Paragraph breaks for bigger pauses.
- Write numbers the way a human says them. "Nola threw seven shutout innings" not "7 SO IP."
- First person. Greet Ryan by name in the open. Sign off warmly in the close.
- ${TONE}

STRUCTURE — ${LENGTH_DESC}. The minimum word count is a HARD FLOOR. If you are under it, you have failed. Expand analysis, context, and detail until you clear it.

Per-segment guidance (for the 30-minute target; scale proportionally for shorter):
1. COLD OPEN (60–100 words): Lead with last night's biggest Philly result if any team played. Otherwise lead with the biggest Tier 1 Philly storyline.
2. WELCOME (200–300 words): Greet Ryan, ground the date, preview top three or four stories.
3. PHILLIES SEGMENT (800–1000 words): Open with last night's game if they played — final score, pitching line, standout performances. Then today's matchup, fresh injuries, roster moves, standings. If off, say so and pivot to current beat reporting.
4. EAGLES SEGMENT (800–1000 words): Current reporting only. Today's roster moves, this morning's beat reports, rookie development, OTAs.
5. SIXERS SEGMENT (500–700 words): Open with last night's game if they played. Then injuries, front office, trades, current playoff/offseason status.
6. FLYERS SEGMENT (500–700 words): Open with last night's game if they played. Then prospects, trades, injuries.
7. AROUND THE LEAGUES (600–900 words): Brisk quick-hits from NBA, NFL, MLB, NHL — heavy on last night's biggest results. Weave, don't list.
8. CLOSE (100–200 words): One reflection, warm sign-off to Ryan by name, tease tomorrow.

When you are done writing, output the script directly with no surrounding text. Start the response with the cold open's first word.`;

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
const script = data.content
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

// Length safety net — fail loud if the script is suspiciously short.
// This catches cases where the model narrated its plan instead of writing the show.
const wordCount = script.split(/\s+/).length;
if (wordCount < MIN_WORDS) {
  console.error('=== SHORT SCRIPT DIAGNOSTIC ===');
  console.error(`Got ${wordCount} words, expected at least ${MIN_WORDS}.`);
  console.error('stop_reason:', data.stop_reason);
  console.error('usage:', JSON.stringify(data.usage));
  console.error('First 500 chars of output:');
  console.error(script.slice(0, 500));
  throw new Error(`Script too short: ${wordCount} words (minimum ${MIN_WORDS}). The model likely narrated instead of writing the full show. Build failed so the missed-run alert will fire.`);
}

const header =
  `Ryan's Sports Podcast — ${longDate}\n` +
  `${'='.repeat(60)}\n\n`;

await fs.mkdir('episodes', { recursive: true });
await fs.writeFile(`episodes/${date}.txt`, header + script);
console.log(`Wrote episodes/${date}.txt (${wordCount} words, model=${CONFIG.model})`);
