/** Keep synced with apps/web/content/blog/*.mdx (native cannot read MDX off disk). */

export type BlogManifestEntry = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
  body: string;
};

export const BLOG_POSTS: Record<string, BlogManifestEntry> = {
  'notice-scanner-before-launch': {
    slug: 'notice-scanner-before-launch',
    title: 'Notice Scanner — what we are testing before launch',
    description:
      'A peek at how we turn a photo of a legal notice into plain language, dates, and next steps — without replacing your lawyer.',
    date: '2026-04-08',
    author: 'Jurisly Team',
    body:
      'Legal notices are designed for courts and lawyers, not for the person opening the envelope.\n\n' +
      'Our Notice Scanner combines OCR, structure detection, and careful AI prompting for: notice type; deadlines and amounts where visible; plain-language summaries (orientation only, not legal advice); suggested next steps with a verified-lawyer path.\n\n' +
      'We will publish redacted outputs and safety metrics as scanning opens broadly.',
  },
};
