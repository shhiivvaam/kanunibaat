# Project Flows

This document explains the core product and business flows implemented in the codebase.

## 1) Visitor -> waitlist/user acquisition

1. User lands on locale marketing routes.
2. Waitlist forms submit via tRPC (`waitlist.submitUser` / `waitlist.submitLawyer`).
3. API sends notifications through shared waitlist env integration.
4. Lead enters growth pipeline.

Primary code paths:

- `apps/web/src/app/[locale]/(marketing)/waitlist/*`
- `packages/trpc/src/router.ts` (`waitlist` router)

## 2) Authentication + profile bootstrap

1. User signs in/up via Better Auth routes on web.
2. Protected calls resolve session into `authUserId`.
3. Profile bootstrap ensures role + profile row.
4. App uses `profile.me` as canonical identity payload.

Primary code paths:

- `apps/web/src/lib/auth.ts`
- `packages/trpc/src/router.ts` (`profile.*`)
- `packages/trpc/src/profile-service.ts`

## 3) Lawyer onboarding -> verification -> discovery

1. User creates lawyer draft.
2. Lawyer onboarding flow captures profile/document metadata.
3. Admin review/verification updates status.
4. Verified profiles sync to search index and become discoverable.

Primary code paths:

- `packages/trpc/src/routers/lawyer.ts`
- `packages/trpc/src/routers/admin.ts`
- `packages/trpc/src/routers/marketplace.ts`
- `apps/web/src/app/[locale]/app/lawyer/onboarding/page.tsx`

## 4) Notice scanner flow

1. User uploads notice on marketing scanner route.
2. API classifies/extracts/analyses notice.
3. Result page shows summary, action steps, and lawyer CTA.
4. Scan records persist for history and downstream actions.

Primary code paths:

- `packages/trpc/src/routers/notices.ts`
- `apps/web/src/app/[locale]/(marketing)/notice-scanner/*`

## 5) Emergency guide ("Kya Karein?")

1. User opens scenario list.
2. Scenario-specific detail loads base curated guidance.
3. Personalization mutation validates inputs and calls AI when configured.
4. On failure/no config, curated fallback guide is returned.

Primary code paths:

- `packages/trpc/src/routers/emergency-guide.ts`
- `packages/emergency-guide/src/*`
- `apps/web/src/app/[locale]/(marketing)/kya-karein/*`

## 6) Consultation + billing flow

1. User discovers lawyer and books consultation.
2. Payment order/subscription interactions occur through billing routers.
3. Consultation lifecycle is updated through domain procedures.
4. Razorpay webhooks reconcile server-side state.

Primary code paths:

- `packages/trpc/src/routers/consultations.ts`
- `packages/trpc/src/routers/billing.ts`
- `apps/api/src/http-stack.ts` (Razorpay webhook endpoints)

## 7) Vault and sharing flow

1. User uploads document into vault.
2. Metadata and document records persist in vault domain tables.
3. Share token route exposes controlled access for approved external views.

Primary code paths:

- `packages/trpc/src/routers/vault.ts`
- `apps/web/src/app/[locale]/app/vault/*`
- `apps/web/src/app/[locale]/(marketing)/vault/shared/[token]/page.tsx`

## 8) Practice suite (lawyer operations)

1. Lawyer manages cases/tasks/hearings/invoices in `/app/practice`.
2. Practice analytics and billing endpoints aggregate operational metrics.
3. Notifications and case tracker support reminders and status surfaces.

Primary code paths:

- `packages/trpc/src/routers/practice.ts`
- `packages/trpc/src/routers/practice-analytics.ts`
- `packages/trpc/src/routers/practice-billing.ts`
- `packages/trpc/src/routers/cases.ts`

## 9) Content and legal Q&A

1. Public users browse rights/content pages.
2. Q&A questions and answers run through typed procedures.
3. Content supports trust-building + SEO surfaces.

Primary code paths:

- `packages/trpc/src/routers/content.ts`
- `packages/trpc/src/routers/qa.ts`
- `apps/web/src/app/[locale]/(marketing)/rights/*`
- `apps/web/src/app/[locale]/(marketing)/legal-qa/*`

## 10) Integrations flow (Phase 15 in progress)

1. WhatsApp inbound webhook receives events.
2. Integration router handles DigiLocker and related integration contracts.
3. Callback routes in web complete user-facing integration loops.

Primary code paths:

- `apps/api/src/whatsapp/*`
- `packages/trpc/src/routers/integrations.ts`
- `apps/web/src/app/[locale]/app/integrations/digilocker/callback/page.tsx`
