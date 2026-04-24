import fs from 'node:fs/promises';

const today = new Date();
const date = today.toISOString().slice(0, 10);
const longDate = today.toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
});

const prompt = buildPrompt({ length: 'medium', tone: 'classic',
  leagues: ['mlb','nba','nfl','nhl'], date: longDate });

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
    tools: [{ type: 'web_search_20250305', name: 'web_search',
             max_uses: 15 }],
  }),
});

const data = await res.json();
const script = data.content
  .filter(b => b.type === 'text')
  .map(b => b.text).join('\n\n');

await fs.mkdir('episodes', { recursive: true });
await fs.writeFile(`episodes/${date}.txt`, script);
console.log('Wrote', `episodes/${date}.txt`);

function buildPrompt({ length, tone, leagues, date }) {
  // paste the buildPrompt() function from this HTML file
  // (it's in the <script> block — copy it as-is)
  return '';
}
