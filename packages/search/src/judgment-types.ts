export type JudgmentSearchSource = 'meilisearch' | 'postgres';

export interface JudgmentSearchHit {
  id: string;
  title: string;
  court: string;
  citation: string;
  decisionAt: string | null;
  summaryExcerpt: string;
  topics: string[];
}
