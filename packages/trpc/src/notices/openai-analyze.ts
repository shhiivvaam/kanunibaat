import { z } from 'zod';

export const noticeAnalysisSchema = z.object({
  notice_type: z.string().min(1).max(120),
  issuing_authority: z.string().max(200).nullable().optional(),
  is_likely_genuine: z.boolean().nullable().optional(),
  plain_summary: z.string().min(1).max(4000),
  recommended_actions: z.array(z.string().min(1).max(240)).min(3).max(8),
  recommended_lawyer_type: z.string().min(1).max(120),
  deadline_date_iso: z.string().datetime().nullable().optional(),
  amount_inr: z.number().int().positive().nullable().optional(),
});

export type NoticeAnalysis = z.infer<typeof noticeAnalysisSchema>;

export async function analyzeNoticeWithOpenAI(
  apiKey: string,
  ocrText: string,
  locale: string,
): Promise<NoticeAnalysis> {
  const system = [
    'You are an Indian legal information assistant.',
    'You must provide GENERAL INFORMATION only, not individualized legal advice.',
    'Always include a disclaimer implicitly by keeping language general.',
    'Return STRICT JSON only, matching the provided schema. No markdown.',
  ].join(' ');

  const user = [
    `Language locale: ${locale}`,
    'Given this OCR text of a legal notice, classify it and summarize in plain language.',
    'Extract issuing authority, whether it seems likely genuine (null if unsure), any deadline date (ISO string) and amount in INR (number).',
    'Provide 3-8 next steps as short actionable bullets.',
    'Recommend a lawyer type/category.',
    '',
    'OCR_TEXT_START',
    ocrText.slice(0, 12000),
    'OCR_TEXT_END',
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
    throw new Error(`OpenAI analysis failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty analysis.');

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON content.');
  }

  const parsed = noticeAnalysisSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(`OpenAI analysis did not match schema: ${parsed.error.message}`);
  }
  return parsed.data;
}
