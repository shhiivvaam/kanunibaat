import type { Metadata } from 'next';
import Link from 'next/link';

import { getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Updates, explainers, and product notes from KanooniBaat — legal help for India in plain language.',
  openGraph: {
    title: 'Blog | KanooniBaat',
    description: 'Updates and explainers from the KanooniBaat team.',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-6 py-16">
      <div className="mx-auto max-w-[720px]">
        <p className="mb-4 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
          <Link href="/" className="text-[#C2410C] hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1C1917]">Blog</span>
        </p>
        <h1
          className="mb-4 text-4xl font-bold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Blog & updates
        </h1>
        <p className="mb-12 text-lg text-[#57534E]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
          Product news, legal explainers, and how we think about access to justice.
        </p>

        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="rounded-[20px] border border-[#E7E5E4] bg-white p-6 transition-shadow hover:shadow-md">
                <time
                  dateTime={post.date}
                  className="text-xs uppercase tracking-wider text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  {post.date}
                </time>
                <h2 className="mt-2 text-xl font-bold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
                  <Link href={`/blog/${post.slug}`} className="hover:text-[#C2410C]">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
                  {post.description}
                </p>
                {post.author ? (
                  <p className="mt-3 text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                    {post.author}
                  </p>
                ) : null}
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-block text-sm font-semibold text-[#C2410C] hover:underline"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Read more →
                </Link>
              </article>
            </li>
          ))}
        </ul>

        {posts.length === 0 ? (
          <p className="text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            No posts yet. Check back soon.
          </p>
        ) : null}
      </div>
    </div>
  );
}
