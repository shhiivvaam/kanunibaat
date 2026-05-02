import { MarketingShell } from '@/features/marketing/marketing-shell';
import { isWaitlistCampaign } from '@/lib/marketing-campaign';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell variant={isWaitlistCampaign() ? 'waitlist' : 'full'}>{children}</MarketingShell>
  );
}
