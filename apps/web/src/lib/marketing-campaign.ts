/**
 * Public marketing mode for the Next.js site only. When `waitlist`, middleware narrows
 * discoverable routes and the home page shows the campaign landing.
 */
export type MarketingCampaignMode = 'full' | 'waitlist';

export function getMarketingCampaignMode(): MarketingCampaignMode {
  const v = process.env.NEXT_PUBLIC_MARKETING_CAMPAIGN?.trim().toLowerCase();
  return v === 'waitlist' ? 'waitlist' : 'full';
}

export function isWaitlistCampaign(): boolean {
  return getMarketingCampaignMode() === 'waitlist';
}
