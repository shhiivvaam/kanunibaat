import { z } from 'zod';

const relationship = z.enum(['follows', 'distinguishes', 'applied', 'overruled', 'related']);

export const citationChainSchema = z.object({
  nodes: z
    .array(
      z.object({
        label: z.string().min(1).max(200),
        citation: z.string().min(1).max(300),
        relationship: relationship,
        note: z.string().max(600),
      }),
    )
    .min(1)
    .max(12),
  disclaimer: z.string().max(500).optional(),
});

export type CitationChainResult = z.infer<typeof citationChainSchema>;

export async function suggestCitationChainWithOpenAI(
  apiKey: string,
  input: { seedCitation: string; contextNotes?: string },
): Promise<CitationChainResult> {
  const system = [
    'You assist Indian lawyers with research.',
    'Given a seed case citation and optional notes, suggest a plausible citation chain (prior/later cases that often cite or relate).',
    'Use well-known landmark patterns where applicable; if uncertain, mark relationship as "related" and keep notes cautious.',
    'Return STRICT JSON: nodes (array of {label, citation, relationship, note}), optional disclaimer string.',
    'relationship must be one of: follows, distinguishes, applied, overruled, related.',
    'No markdown.',
  ].join(' ');

  const user = [
    `Seed citation: ${input.seedCitation.trim().slice(0, 400)}`,
    input.contextNotes ? `Context:\n${input.contextNotes.trim().slice(0, 2000)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI citation chain failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty citation chain.');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON content.');
  }

  const parsed = citationChainSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI citation chain invalid: ${parsed.error.message}`);
  }
  return parsed.data;
}
