CREATE TYPE "public"."notice_scan_status" AS ENUM('uploaded', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "notice_scan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"access_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"anon_key" text,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"uploaded_at" timestamp with time zone,
	"status" "notice_scan_status" DEFAULT 'uploaded' NOT NULL,
	"ocr_text" text,
	"notice_type" text,
	"issuing_authority" text,
	"is_likely_genuine" integer,
	"deadline_date" timestamp with time zone,
	"amount_inr" integer,
	"ai_summary" text,
	"recommended_actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_lawyer_type" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notice_scan" ADD CONSTRAINT "notice_scan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notice_scan" ADD CONSTRAINT "notice_scan_access_token_unique" UNIQUE("access_token");--> statement-breakpoint
CREATE INDEX "notice_scan_user_id_idx" ON "notice_scan" ("user_id");--> statement-breakpoint
CREATE INDEX "notice_scan_status_idx" ON "notice_scan" ("status");--> statement-breakpoint
CREATE INDEX "notice_scan_anon_key_idx" ON "notice_scan" ("anon_key");--> statement-breakpoint
CREATE INDEX "notice_scan_created_at_idx" ON "notice_scan" ("created_at");
