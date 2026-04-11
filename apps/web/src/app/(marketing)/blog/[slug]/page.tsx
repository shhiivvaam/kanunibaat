import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { blogMdxComponents } from '@/features/marketing/blog-mdx-components';
import { getAllSlugs, getPostBySlug } from '@/lib/blog';

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: `${post.title} | KanooniBaat`,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen bg-[#FAFAF9] px-6 py-16">
      <article className="mx-auto max-w-[720px]">
        <p className="mb-6 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
          <Link href="/" className="text-[#C2410C] hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="text-[#C2410C] hover:underline">
            Blog
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1C1917]">{post.title}</span>
        </p>

        <header className="mb-10 border-b border-[#E7E5E4] pb-8">
          <time
            dateTime={post.date}
            className="text-xs uppercase tracking-wider text-[#C2410C]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            {post.date}
          </time>
          <h1
            className="mt-3 text-4xl font-bold tracking-tight text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {post.title}
          </h1>
          {post.author ? (
            <p className="mt-3 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              By {post.author}
            </p>
          ) : null}
          <p className="mt-4 text-lg text-[#57534E]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
            {post.description}
          </p>
        </header>

        <div className="blog-mdx-content">
          <MDXRemote source={post.body} components={blogMdxComponents} />
        </div>

        <footer className="mt-16 border-t border-[#E7E5E4] pt-8">
          <Link href="/blog" className="text-sm font-semibold text-[#C2410C] hover:underline" style={{ fontFamily: 'var(--font-body)' }}>
            ← All posts
          </Link>
        </footer>
      </article>
    </div>
  );
}
