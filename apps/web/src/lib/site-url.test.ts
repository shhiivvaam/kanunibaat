import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getSiteUrl } from './site-url';

describe('getSiteUrl', () => {
  const prev = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prev;
  });

  it('defaults to production marketing host when unset', () => {
    expect(getSiteUrl()).toBe('https://tryjurisly.com');
  });

  it('trims and strips trailing slash from env', () => {
    process.env.NEXT_PUBLIC_APP_URL = ' https://example.com/ ';
    expect(getSiteUrl()).toBe('https://example.com');
  });
});
