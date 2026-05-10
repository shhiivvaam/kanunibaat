import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
}

export const blogMdxComponents: MDXComponents = {
  h1: (props: Props) => (
    <h1
      className="mt-10 text-3xl font-bold tracking-tight text-[#1C1917] first:mt-0"
      style={{ fontFamily: 'var(--font-display)' }}
      {...props}
    />
  ),
  h2: (props: Props) => (
    <h2
      className="mt-8 text-2xl font-semibold text-[#1C1917]"
      style={{ fontFamily: 'var(--font-display)' }}
      {...props}
    />
  ),
  h3: (props: Props) => (
    <h3
      className="mt-6 text-xl font-semibold text-[#1C1917]"
      style={{ fontFamily: 'var(--font-display)' }}
      {...props}
    />
  ),
  p: (props: Props) => (
    <p
      className="leading-relaxed text-[#44403C]"
      style={{ fontFamily: 'var(--font-body)', lineHeight: 1.75 }}
      {...props}
    />
  ),
  ul: (props: Props) => (
    <ul
      className="my-4 list-disc space-y-2 pl-6 text-[#44403C]"
      style={{ fontFamily: 'var(--font-body)' }}
      {...props}
    />
  ),
  ol: (props: Props) => (
    <ol
      className="my-4 list-decimal space-y-2 pl-6 text-[#44403C]"
      style={{ fontFamily: 'var(--font-body)' }}
      {...props}
    />
  ),
  li: (props: Props) => <li className="leading-relaxed" style={{ lineHeight: 1.75 }} {...props} />,
  strong: (props: Props) => <strong className="font-semibold text-[#1C1917]" {...props} />,
  a: (props: Props) => (
    <a className="font-medium text-[#C2410C] underline-offset-2 hover:underline" {...props} />
  ),
};
