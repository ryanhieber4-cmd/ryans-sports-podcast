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
  short:  'roughly ten minutes, 1400 to 1700 words',
  medium: 'roughly twenty minutes, 2800 to 3300 words',
  long:   'roughly thirty minutes, 4200 to 4800 words',
}[CONFIG.length];

const TONE = {
  classic: 'Veteran Philadelphia sports radio host — warm, confident, knowledgeable. The smart best-of-WIP voice without the screaming.',
  hot:     'Opinionated Philly sports columnist energy. Strong takes, more edge, still fair. Think Marcus Hayes or old-school Bill Conlin — willing to call things out.',
  calm:    'The Athletic-style analytical voice. Measured, data-aware, thoughtful. Less reaction, more context and pattern.',
}[CONFIG.tone];

const prompt = `You are a sports podcast host producing today's daily show for Ryan, a Philadelphia sports fan. Today is ${longDate}.

TASK: Use the web_search tool to find today's most important sports news, then write a complete spoken-word podcast script.

SEARCH STRATEGY — run these searches, in this order:
1. "Philadelphia Phillies news today" — find every material update (games, injuries, roster, trades, manager quotes)
2. "Philadelphia Eagles news today" — same depth. Draft and offseason reporting matter
3. "Philadelphia 76ers news today" — playoff context, injury updates, front office
4. "Philadelphia Flyers news today" — playoff race or offseason news
5. "NBA news today" — top league headlines
6. "NFL news today"
7. "MLB news today"
8. "NHL news today"

Prefer results from the last 24 to 48 hours. Trust ESPN, The Athletic, NBC Sports Philadelphia, The Philadelphia Inquirer, Action Network, and team beat writers. Be skeptical of social media rumor aggregators.

PRIORITY: Do not miss any material Philadelphia news. The four Philly teams are the spine of the show. League news is supporting.

OUTPUT FORMAT — a natural spoken-word podcast script. This will be read aloud by ElevenReader's TTS.

HARD RULES FOR TTS:
- NO markdown symbols anywhere. No asterisks, pound signs, bullets, numbered lists, brackets, pipes.
- NO section headers. Use spoken transitions: "Alright, let's turn to the Eagles..." "Now over to the Sixers..."
- Use em-dashes sparingly. Paragraph breaks for bigger pauses.
- Write numbers the way a human says them. "Nola threw seven shutout innings" not "7 SO IP."
- Speak in first person. Greet Ryan by name in the open. Sign off warmly in the close.
- ${TONE}

STRUCTURE — ${LENGTH}:
1. COLD OPEN: fifteen to twenty-five seconds, one sharp hook from today's biggest Philly story
2. WELCOME: greet Ryan, ground the date, set up today's top three or four stories
3. PHILLIES — everything meaningful from today
4. EAGLES — same
5. SIXERS — same
6. FLYERS — same
7. AROUND THE LEAGUES — brisk quick-hits from NBA, NFL, MLB, NHL
8. CLOSE — one reflection, warm sign-off to Ryan, tease tomorrow

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
    max_tokens: 8000,
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

if (!script) throw new Error('Empty script returned from Anthropic.');

const header =
  `Ryan's Sports Podcast — ${longDate}\n` +
  `${'='.repeat(60)}\n\n`;

await fs.mkdir('episodes', { recursive: true });
await fs.writeFile(`episodes/${date}.txt`, header + script);
console.log(`Wrote episodes/${date}.txt (${script.split(/\s+/).length} words)`);
