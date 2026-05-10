/**
 * Public marketplace search/list DTO — identical for Meilisearch hits and Postgres fallback rows.
 */
export interface MarketplaceLawyerHit {
  userId: string;
  slug: string;
  displayName: string | null;
  headline: string;
  city: string | null;
  barState: string | null;
  practiceAreas: string[];
  languages: string[];
  yearsExperience: number | null;
}
