import Anthropic from '@anthropic-ai/sdk';
import { SourcedInsight } from '../types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface RawInsight {
  text: string;
  type: 'insight' | 'risk' | 'opportunity';
  source: string;
  url: string;
}

export async function getLocalInsights(
  cityName: string,
  state: string,
): Promise<SourcedInsight[]> {
  if (!process.env.ANTHROPIC_API_KEY) return [];

  const location = state ? `${cityName}, ${state}` : cityName;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' } as unknown as Anthropic.Tool],
      messages: [
        {
          role: 'user',
          content: `Search for recent real estate news and market analysis for ${location}.
Find 2-3 key insights, 1-2 risk factors, and 1-2 opportunities from local news sources, real estate firm reports (Zillow, Redfin, CoStar, CBRE, JLL, Marcus & Millichap), or local newspapers published in the last 6 months.

Return a JSON array only — no other text — in this exact format:
[
  { "text": "one-sentence finding", "type": "insight", "source": "Publication Name", "url": "https://..." },
  { "text": "one-sentence risk", "type": "risk", "source": "Publication Name", "url": "https://..." },
  { "text": "one-sentence opportunity", "type": "opportunity", "source": "Publication Name", "url": "https://..." }
]

Rules:
- Each "text" must be specific to ${location}, not generic
- "type" must be exactly "insight", "risk", or "opportunity"
- Include the real URL of the article or report
- Maximum 5 items total`,
        },
      ],
    });

    // Extract the final text response
    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') return [];

    // Pull JSON out of the response (model may wrap it in markdown)
    const match = textBlock.text.match(/\[[\s\S]*\]/);
    if (!match) return [];

    const raw: RawInsight[] = JSON.parse(match[0]);

    return raw
      .filter(r => r.text && ['insight', 'risk', 'opportunity'].includes(r.type))
      .map(r => ({
        text: r.text,
        type: r.type,
        source: r.source || undefined,
        url: r.url || undefined,
      }));
  } catch (err) {
    console.error('localInsights error:', err);
    return [];
  }
}
