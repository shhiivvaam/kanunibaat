import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';

import { renderSafeInlineText } from './render-safe-inline-text';

describe('renderSafeInlineText', () => {
  it('renders plain text', () => {
    const { container } = render(renderSafeInlineText('hello', 'k'));
    expect(container).toHaveTextContent('hello');
  });

  it('renders allow-listed strong tags', () => {
    render(renderSafeInlineText('a <strong>bold</strong> b', 'k'));
    expect(screen.getByText('bold')).toBeInTheDocument();
    const strong = screen.getByText('bold');
    expect(strong.tagName).toBe('STRONG');
  });
});
