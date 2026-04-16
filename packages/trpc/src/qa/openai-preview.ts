import { z } from 'zod';

export const qaAiPreviewSchema = z.object({
  summary: z.string().min(1).max(2000),
  steps: z.array(z.string().min(1).max(240)).min(3).max(8),
  applicable_laws: z.array(z.string().min(1).max(180)).max(12).optional().default([]),
  disclaimer: z.string().min(1).max(800),
});

export type QaAiPreview = z.infer<typeof qaAiPreviewSchema>;

export async function generateQaPreviewWithOpenAI(opts: {
  apiKey: string;
  title: string;
  body: string;
  locale: string;
}): Promise<QaAiPreview> {
  const system = [
    'You are an Indian legal information assistant.',
    'Provide GENERAL INFORMATION only; do not provide individualized legal advice.',
    'Be clear, calm, and actionable.',
    'Return STRICT JSON only matching schema. No markdown.',
  ].join(' ');

  const user = [
    `Language locale: ${opts.locale}`,
    'Create a short non-advice preview answer for a public legal Q&A forum.',
    'Include 3-8 generic steps and a strong disclaimer.',
    '',
    `QUESTION_TITLE: ${opts.title.slice(0, 200)}`,
    'QUESTION_BODY_START',
    opts.body.slice(0, 6000),
    'QUESTION_BODY_END',
  ].join('\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
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
    throw new Error(`OpenAI Q&A preview failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty preview.');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON content.');
  }

  const parsed = qaAiPreviewSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI Q&A preview did not match schema: ${parsed.error.message}`);
  }
  return parsed.data;
}

