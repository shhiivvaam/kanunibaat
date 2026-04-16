import { z } from 'zod';

export const DRAFT_TEMPLATE_KEYS = ['legal_notice_reply', 'bail_application_outline', 'written_statement_outline'] as const;
export type DraftTemplateKey = (typeof DRAFT_TEMPLATE_KEYS)[number];

const draftSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(12_000),
  checklist: z.array(z.string().min(1).max(300)).max(16).optional().default([]),
});

export type DraftTemplateResult = z.infer<typeof draftSchema>;

const TEMPLATE_HINTS: Record<DraftTemplateKey, string> = {
  legal_notice_reply:
    'Draft a structured reply to a legal notice: opening, admissions/denials, legal submissions, prayer. Use Indian legal tone; placeholders in square brackets where facts missing.',
  bail_application_outline:
    'Outline for a bail application before Indian courts: facts, custody, grounds (illness/cooperation etc. as applicable), precedents slot, prayer.',
  written_statement_outline:
    'Outline for a written statement under CPC: preliminary objections, facts, issues, denial/admission pattern, relief.',
};

export async function fillDraftTemplateWithOpenAI(
  apiKey: string,
  templateKey: DraftTemplateKey,
  facts: Record<string, string>,
): Promise<DraftTemplateResult> {
  const hint = TEMPLATE_HINTS[templateKey];
  const factsJson = JSON.stringify(facts, null, 2).slice(0, 6000);

  const system = [
    'You draft Indian litigation templates for qualified lawyers to edit.',
    'Return STRICT JSON: title (string), body (string, can use markdown headings ##), checklist (string array, optional).',
    'Do not fabricate party names or dates; use [PLACEHOLDER] when unknown.',
    hint,
  ].join(' ');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Facts (JSON):\n${factsJson}` },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI draft failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty draft.');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON content.');
  }

  const parsed = draftSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI draft invalid: ${parsed.error.message}`);
  }
  return parsed.data;
}
