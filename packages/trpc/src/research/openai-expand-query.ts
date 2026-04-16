import { z } from 'zod';

const schema = z.object({
  searchTerms: z.string().min(1).max(500),
});

export async function expandResearchQueryWithOpenAI(apiKey: string, naturalLanguage: string): Promise<string> {
  const nl = naturalLanguage.trim().slice(0, 2000);
  const system =
    'You help lawyers search a judgment database. Output STRICT JSON only: {"searchTerms":"..."} — a concise keyword string suitable for full-text search (cases, statutes, topics). Indian legal context. No markdown.';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Convert to search keywords:\n${nl}` },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI query expansion failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty query expansion.');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON content.');
  }

  const parsed = schema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI query expansion invalid: ${parsed.error.message}`);
  }
  return parsed.data.searchTerms;
}
