import { z } from 'zod';

export const vaultSummarySchema = z.object({
  summary: z.string().min(1).max(8000),
  bullets: z.array(z.string().min(1).max(400)).max(12),
});

export type VaultSummary = z.infer<typeof vaultSummarySchema>;

const MAX_INPUT_CHARS = 16_000;

export async function summarizeVaultPlaintextWithOpenAI(
  apiKey: string,
  plaintext: string,
  locale: string,
): Promise<VaultSummary> {
  const clipped = plaintext.slice(0, MAX_INPUT_CHARS);
  const system = [
    'You are an Indian legal information assistant.',
    'The user pasted decrypted document text for a high-level summary only.',
    'Provide GENERAL INFORMATION only, not individualized legal advice.',
    'Return STRICT JSON only, matching the schema. No markdown.',
  ].join(' ');

  const user = [
    `Language locale: ${locale}`,
    'Summarize the following document text. Focus on parties, dates, obligations, and risks.',
    'Return JSON with keys: summary (string), bullets (array of short strings, max 12).',
    '',
    'TEXT_START',
    clipped,
    'TEXT_END',
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
    throw new Error(`OpenAI vault summary failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty vault summary.');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON content.');
  }

  const parsed = vaultSummarySchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI vault summary did not match schema: ${parsed.error.message}`);
  }
  return parsed.data;
}
