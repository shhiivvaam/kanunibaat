export type { MarketplaceLawyerHit } from './types';
export type { LawyerSearchSource } from './search-with-fallback';
export type { JudgmentSearchHit, JudgmentSearchSource } from './judgment-types';
export type { MeiliConnection } from './meili-http';
export { searchMeiliRaw, upsertMeiliDocuments } from './meili-http';
export { searchLawyersWithFallback } from './search-with-fallback';
export { searchJudgmentsWithFallback } from './judgment-search-with-fallback';
export { searchLawyersPostgres } from './postgres-search';
export { searchJudgmentsPostgres } from './judgment-postgres-search';
export { searchJudgmentsMeili } from './judgment-meili';
export {
  DEFAULT_JUDGMENTS_INDEX,
  DEFAULT_LAWYERS_INDEX,
  deleteLawyerMeili,
  parseMeiliConfigFromEnv,
  searchLawyersMeili,
  upsertLawyersMeili,
} from './meili';
export { syncLawyerMeiliFromDb } from './sync-lawyer-index';
export {
  researchJudgmentRowToMeiliDocument,
  syncResearchJudgmentsToMeili,
} from './sync-research-judgment-index';
