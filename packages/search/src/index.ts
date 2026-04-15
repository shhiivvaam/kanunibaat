export type { MarketplaceLawyerHit } from './types';
export type { LawyerSearchSource } from './search-with-fallback';
export type { MeiliConnection } from './meili-http';
export { searchLawyersWithFallback } from './search-with-fallback';
export { searchLawyersPostgres } from './postgres-search';
export {
  DEFAULT_LAWYERS_INDEX,
  deleteLawyerMeili,
  parseMeiliConfigFromEnv,
  searchLawyersMeili,
  upsertLawyersMeili,
} from './meili';
export { syncLawyerMeiliFromDb } from './sync-lawyer-index';
