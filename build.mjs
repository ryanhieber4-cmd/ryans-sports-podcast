import fs from 'node:fs/promises';

// ─── EDIT THESE TWO LINES TO CHANGE YOUR DAILY PODCAST STYLE ───
const CONFIG = {
  length: 'long',   // 'short' (10 min) | 'medium' (20 min) | 'long' (30 min)
  tone:   'calm',   // 'classic' (Classic Radio) | 'hot' (Hot Take) | 'calm' (Analytical)
};
// ────────────────────────────────────────────────────────────────

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
- Today is ${longDate} (${monthDay})
- Yesterday was ${longYesterday} (${monthDayYesterday})
- The show is being prepared early this morning, so "last night" means games and news from yesterday evening

THE FRESHNESS DOCTRINE — read this section twice. This is the most important part of your job.

This is a DAILY podcast. Ryan listened to yesterday's episode. He already heard everything that broke before roughly 6 AM yesterday. Reporting yesterday's news again is the cardinal failure of this show. Old news with no new angle is worse than no news.

Sort every potential story into a tier. Lead with TIER 1, support with TIER 2, REJECT TIER 3.

TIER 1 — LEAD THE SHOW WITH THESE. Stories from the last 12 hours, specifically:
  • Games played last night — final scores, standout performances, pitching lines, key moments
  • News broken overnight or this morning
  • Beat writer columns published today (this morning's Inquirer, today's NBC Sports Philly, today's Athletic)
  • Press conferences and quotes from last night or this morning
  • Trades, injuries, signings, roster moves announced after roughly 8 PM yesterday
  • Game previews for TONIGHT's games (probable pitchers, key matchups)

TIER 2 — INCLUDE ONLY IF THERE'S A NEW ANGLE TODAY. Stories from 12–24 hours ago, only if there has been a new development today (a fresh quote, a follow-up report, a related move, a status update). If the story broke at 2 PM yesterday and nothing has happened since, it is already old news — DROP IT.

TIER 3 — REJECT OUTRIGHT, do not include in the show:
  • Anything older than 24 hours with no new development
  • Mock drafts after the draft has happened
  • Pre-game predictions for games already played
  • Rumor pieces that have since been confirmed or denied (use the resolution, not the rumor)
  • Preview articles for games whose results we now know
  • Recaps of stories Ryan would have heard yesterday

THE STALE-CONTENT FILTER — apply this before writing each segment.

For every story you have, ask: "Did this break in the last 12 hours, OR has there been a new development today?" If neither, DROP IT. If a story has been re-reported throughout yesterday but nothing new has happened, DROP IT. When two pieces cover the same news, use the most recent and discard the older.

SEARCH STRATEGY.

Run these searches. Some explicitly target "last night" and "this morning" to pull Tier 1 results — beat writers headline content that way. After every search, scan the result publish dates and only use results dated today or yesterday evening.

PHILLY TIER (run all of these — do not skip a team even if a search comes back thin):
1. "Phillies last night" — last night's game result, box score, standout performances
2. "Phillies this morning" OR "Phillies ${monthDay}" — this morning's beat reporting, today's lineup, fresh injury updates
3. "Eagles news this morning" OR "Eagles ${monthDay}" — current beat reporting on the team
4. "Sixers ${monthDay}" OR "Sixers news today" — current status, injuries, front office
5. "Flyers ${monthDay}" OR "Flyers news today" — current status, trades, injuries

LEAGUE TIER (run all four — these should be heavily last-night-focused):
6. "NBA last night recap" — last night's results and biggest storylines
7. "NFL news today" — today's reporting, roster moves, injuries
8. "MLB last night recap" — last night's results across the league
9. "NHL last night recap" — last night's results across the league

FOLLOW-UPS as needed (use remaining search budget for these):
  • If a Philly search returned nothing fresh, try a beat writer's name (Matt Gelb for Phillies, Jimmy Kempski or Zach Berman for Eagles, Kyle Neubeck or Tim Bontemps for Sixers, Charlie O'Connor for Flyers) or "Inquirer [team]" or "NBC Sports Philly [team]"
  • If a major story is unfolding, run one follow-up to get the latest details
  • Don't waste searches on confirmation — if you've seen the news, move on

If a Philly team genuinely has nothing newsworthy from the last 24 hours (off-day, deep offseason), give it 60–90 seconds in the show — note the quiet, mention upcoming schedule, recent context — then move on. Better to be brief than to fill with stale recaps.

SOURCE QUALITY: Trust ESPN, The Athletic, NBC Sports Philadelphia, The Philadelphia Inquirer, Action Network, MLB.com / NBA.com / NFL.com / NHL.com, and named team beat writers. Be skeptical of social media rumor aggregators and unsourced fan blogs.

PRIORITY: Do not miss any material Philadelphia news from the last 12 hours. The four Philly teams are the spine of the show. League news is supporting.

OUTPUT FORMAT — a natural spoken-word podcast script. This will be read aloud by ElevenReader's TTS.

HARD RULES FOR TTS:
- NO markdown symbols anywhere. No asterisks, pound signs, bullets, numbered lists, brackets, pipes.
- NO section headers. Use spoken transitions: "Alright, let's turn to the Eagles..." "Now over to the Sixers..."
- Use em-dashes sparingly. Paragraph breaks for bigger pauses.
- Write numbers the way a human says them. "Nola threw seven shutout innings" not "7 SO IP."
- Speak in first person. Greet Ryan by name in the open. Sign off warmly in the close.
- ${TONE}

STRUCTURE — ${LENGTH}. TREAT THE LENGTH TARGET AS A HARD MINIMUM. The word range is not a suggestion — if you are under the minimum, you have not done the job. Expand analysis, add context, draw connections, deepen the discussion. Do not wrap up early.

Per-segment guidance (for the 30-minute target; scale proportionally for shorter):
1. COLD OPEN: 60–100 words. One sharp hook from today's biggest Philly story (must be Tier 1).
2. WELCOME: 200–300 words. Greet Ryan, ground the date, preview the top three or four stories with a sentence on why each matters.
3. PHILLIES SEGMENT: 800–1000 words. Last night's game if they played (full recap), today's pitching matchup if there is one, standout individual performances, fresh injuries, roster moves from the last 24 hours, current standings position. Analytical lens — what do recent trends tell us.
4. EAGLES SEGMENT: 800–1000 words. Current reporting only. Today's roster moves, this morning's beat reports, rookie development, OTA updates, schedule news. Never report mock drafts or pre-event speculation as news.
5. SIXERS SEGMENT: 500–700 words. Current status (playoffs or offseason), injury reports filed today, front office news, trade rumors with the latest update, coaching news.
6. FLYERS SEGMENT: 500–700 words. Current status, prospect news, trades from the last 24 hours, injuries.
7. AROUND THE LEAGUES: 600–900 words. Brisk quick-hits from NBA, NFL, MLB, NHL — heavily focused on last night's results and today's biggest storylines. Weave these — don't list them.
8. CLOSE: 100–200 words. One genuine reflection connecting the day's threads, warm sign-off to Ryan by name, tease tomorrow.

Before you finalize, do two checks:
  (a) Is every story I'm reporting from the last 12–24 hours? Drop anything older.
  (b) Is my total word count above the minimum target? If not, expand the thinnest segments with analysis and context.

Output ONLY the script. No preamble, no explanations, no list of sources. Start directly with the cold open.`;

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 32000,
    messages: [{ role: 'user', content: prompt }],
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 18 }],
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

const header =
  `Ryan's Sports Podcast — ${longDate}\n` +
  `${'='.repeat(60)}\n\n`;

await fs.mkdir('episodes', { recursive: true });
await fs.writeFile(`episodes/${date}.txt`, header + script);
console.log(`Wrote episodes/${date}.txt (${script.split(/\s+/).length} words)`);
