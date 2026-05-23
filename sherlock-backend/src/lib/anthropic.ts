const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

export interface NarrationRequest {
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}

export async function narrate({ apiKey, systemPrompt, userPrompt, maxTokens = 800 }: NarrationRequest): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${body}`);
  }

  const data: { content: Array<{ type: string; text: string }> } = await res.json();
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (!text) throw new Error('Anthropic returned empty text');
  return text;
}
