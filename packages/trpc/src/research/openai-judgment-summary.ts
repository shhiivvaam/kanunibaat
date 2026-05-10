import { z } from 'zod';

export const judgmentSummarySchema = z.object({
  summary: z.string().min(1).max(6000),
  holdings: z.array(z.string().min(1).max(500)).max(10),
  practiceNotes: z.string().max(2000).optional().default(''),
});

export type JudgmentSummary = z.infer<typeof judgmentSummarySchema>;

const MAX_INPUT_CHARS = 14_000;

export async function summarizeJudgmentWithOpenAI(
  apiKey: string,
  payload: { title: string; court: string; citation: string; excerpt: string },
): Promise<JudgmentSummary> {
  const excerpt = payload.excerpt.slice(0, MAX_INPUT_CHARS);
  const system = [
    'You are an Indian legal research assistant.',
    'Summarize the judgment excerpt for a qualified lawyer — holdings and practical notes.',
    'GENERAL INFORMATION only; not individualized legal advice.',
    'Return STRICT JSON: summary (string), holdings (array of strings, max 10), practiceNotes (string, optional).',
    'No markdown.',
  ].join(' ');

  const user = [
    `Title: ${payload.title}`,
    `Court: ${payload.court}`,
    `Citation: ${payload.citation}`,
    '',
    'EXCERPT:',
    excerpt,
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI judgment summary failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty judgment summary.');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON content.');
  }

  const parsed = judgmentSummarySchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI judgment summary invalid: ${parsed.error.message}`);
  }
  return parsed.data;
}
