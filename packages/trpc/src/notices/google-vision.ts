import { z } from 'zod';

const visionResponseSchema = z.object({
  responses: z.array(
    z.object({
      fullTextAnnotation: z
        .object({
          text: z.string().optional(),
        })
        .optional(),
      error: z
        .object({
          message: z.string().optional(),
        })
        .optional(),
    }),
  ),
});

export async function ocrWithGoogleVision(
  apiKey: string,
  bytes: Uint8Array,
): Promise<{ text: string }> {
  const content = Buffer.from(bytes).toString('base64');

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Google Vision OCR failed: ${res.status} ${text}`);
  }

  const json: unknown = await res.json();
  const parsed = visionResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error('Google Vision OCR returned an unexpected response.');
  }

  const first = parsed.data.responses[0];
  if (!first) throw new Error('Google Vision OCR returned no responses.');
  if (first.error?.message) throw new Error(first.error.message);

  const out = first.fullTextAnnotation?.text?.trim() ?? '';
  if (out.length === 0) throw new Error('No text detected in the uploaded notice.');
  return { text: out };
}
