-- Verified-client reviews: one rating per completed consultation
CREATE TABLE "lawyer_consultation_review" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "consultation_id" UUID NOT NULL REFERENCES "consultation"("id") ON DELETE CASCADE,
  "reviewer_user_id" TEXT NOT NULL REFERENCES "user"("id"),
  "lawyer_user_id" TEXT NOT NULL REFERENCES "user"("id"),
  "rating" INTEGER NOT NULL,
  "review_text" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT "lawyer_consultation_review_rating_ck" CHECK ("rating" >= 1 AND "rating" <= 5),
  CONSTRAINT "lawyer_consultation_review_consultation_unique" UNIQUE ("consultation_id")
);--> statement-breakpoint

CREATE INDEX "lawyer_review_lawyer_user_idx" ON "lawyer_consultation_review" ("lawyer_user_id");--> statement-breakpoint
CREATE INDEX "lawyer_review_reviewer_idx" ON "lawyer_consultation_review" ("reviewer_user_id");--> statement-breakpoint
