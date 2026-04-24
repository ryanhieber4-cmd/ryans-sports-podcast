import fs from 'node:fs/promises';

// ─── EDIT THESE TWO LINES TO CHANGE YOUR DAILY PODCAST STYLE ───
const CONFIG = {
  length: 'long',   // 'short' (10 min) | 'medium' (20 min) | 'long' (30 min)
  tone:   'calm',   // 'classic' (Classic Radio) | 'hot' (Hot Take) | 'calm' (Analytical)
};
// ────────────────────────────────────────────────────────────────

const today = new Date();
const date = today.toISOString().slice(0, 10);
const longDate = today.toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
});

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

const prompt = `You are a sports podcast host producing today's daily show for Ryan, a Philadelphia sports fan. Today is ${longDate}.

TASK: Use the web_search tool to find today's most important sports news, then write a complete spoken-word podcast script.

SEARCH STRATEGY — run these searches in this order. Run EVERY Philly search even if early ones give you material — you're building complete coverage, not the fastest path:

Philly priority tier (run all five):
1. "Phillies game recap last night" OR "Phillies ${date} result" — did they play, who pitched, what happened
2. "Phillies news ${date}" — roster moves, injuries, quotes
3. "Eagles news ${date}" — current reporting on the team. 
4. "Sixers news ${date}" — playoff context, injury reports
5. "Flyers news ${date}" — season status, trades, injuries

League tier (one search each):
6. "NBA games last night recap" — scores and top storylines
7. "NFL news ${date}" — if draft recently happened, focus on post-draft coverage, trades, and roster moves
8. "MLB games last night" — top performances and results
9. "NHL games last night" — top performances and results

After each search, check the publication date of results. If the top result is older than 24 hours, run ONE follow-up search with different keywords. Do not skip a Philly team even if the first search is thin — try team beat writer names, local Philly sports sites, or team Twitter.

CRITICAL FRESHNESS RULE: If a story is more than 48 hours old, skip it entirely unless there is a new development today. Mock drafts, pre-game predictions, and speculation pieces published BEFORE an event already happened are garbage — ignore them. Only report what is actually current reality.

Prefer results from the last 18-24 hours. Last night's games and this morning's beat reports are the highest priority. Trust ESPN, The Athletic, NBC Sports Philadelphia, The Philadelphia Inquirer, Action Network, and team beat writers. Check publication dates carefully — a well-written mock draft from three days ago is worthless if the draft already happened. Be skeptical of social media rumor aggregators.
PRIORITY: Do not miss any material Philadelphia news. The four Philly teams are the spine of the show. League news is supporting.

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
1. COLD OPEN: 60–100 words. One sharp hook from today's biggest Philly story.
2. WELCOME: 200–300 words. Greet Ryan, ground the date, preview the top three or four stories with a sentence on why each matters.
3. PHILLIES SEGMENT: 800–1000 words. Game recap if they played, pitching matchup context, standout individual performances, injuries, roster moves, where the team sits in the standings and division. Analytical lens — what do recent trends tell us.
4. EAGLES SEGMENT: 800–1000 words. Current reporting: post-draft reaction, rookie development, roster moves, OTAs, schedule, reporting from beat writers. Never report mock drafts or pre-event speculation as news.
5. SIXERS SEGMENT: 500–700 words. Playoff or offseason status, injury reports, front office, trade rumors, coaching.
6. FLYERS SEGMENT: 500–700 words. Season or offseason status, prospects, trades, injuries.
7. AROUND THE LEAGUES: 600–900 words. Brisk quick-hits from NBA, NFL, MLB, NHL. Last night's results, biggest storylines, injuries, trades. Weave these — don't list them.
8. CLOSE: 100–200 words. One genuine reflection connecting the day's threads, warm sign-off to Ryan by name, tease tomorrow.

Before you finalize, estimate your total word count. If below the minimum target, go back and expand the segments that feel thinnest — add analysis, add context, add specific player and team detail. A too-short show is a failure; a show that hits the word target with real substance is the goal.

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
    tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 15 }],
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
