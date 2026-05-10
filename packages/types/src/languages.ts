import { z } from 'zod';

export const LanguageCodeSchema = z.enum([
  'hi',
  'en',
  'ta',
  'te',
  'kn',
  'mr',
  'gu',
  'bn',
  'pa',
  'ml',
  'or',
  'as',
]);

export type LanguageCode = z.infer<typeof LanguageCodeSchema>;
