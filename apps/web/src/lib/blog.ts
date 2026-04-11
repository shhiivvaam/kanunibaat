import fs from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';

export type BlogFrontmatter = {
  title: string;
  description: string;
  date: string;
  author?: string;
};

export type BlogPostListItem = BlogFrontmatter & {
  slug: string;
};

export type BlogPost = BlogPostListItem & {
  body: string;
};

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

function listMdxFiles(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));
}

export function getAllPosts(): BlogPostListItem[] {
  const files = listMdxFiles();
  const posts: BlogPostListItem[] = [];

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '');
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    const { data } = matter(raw);
    const title = typeof data.title === 'string' ? data.title : slug;
    const description = typeof data.description === 'string' ? data.description : '';
    const date = typeof data.date === 'string' ? data.date : '';
    const author = typeof data.author === 'string' ? data.author : undefined;
    posts.push({ slug, title, description, date, author });
  }

  return posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  const title = typeof data.title === 'string' ? data.title : slug;
  const description = typeof data.description === 'string' ? data.description : '';
  const date = typeof data.date === 'string' ? data.date : '';
  const author = typeof data.author === 'string' ? data.author : undefined;
  return { slug, title, description, date, author, body: content };
}

export function getAllSlugs(): string[] {
  return listMdxFiles().map((f) => f.replace(/\.mdx$/, ''));
}
