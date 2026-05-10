import { Fragment, type ReactNode } from 'react';

/**
 * Renders inline text with a tiny allow-list for emphasis tags.
 * Everything else is rendered as escaped text.
 */
export const renderSafeInlineText = (text: string, keyPrefix: string): ReactNode => {
  const allowedInlineEmphasisTags = /<(strong|b)>([\s\S]*?)<\/\1>/gi;
  const nodes: ReactNode[] = [];
  let currentIndex = 0;
  let emphasisTagMatch: RegExpExecArray | null = null;

  while ((emphasisTagMatch = allowedInlineEmphasisTags.exec(text)) !== null) {
    const [fullMatch, , emphasizedText] = emphasisTagMatch;
    const matchStart = emphasisTagMatch.index;

    if (matchStart > currentIndex) {
      nodes.push(text.slice(currentIndex, matchStart));
    }

    nodes.push(
      <strong key={`${keyPrefix}-strong-${matchStart}`}>{emphasizedText}</strong>,
    );

    currentIndex = matchStart + fullMatch.length;
  }

  if (currentIndex < text.length) {
    nodes.push(text.slice(currentIndex));
  }

  return <Fragment>{nodes}</Fragment>;
};
