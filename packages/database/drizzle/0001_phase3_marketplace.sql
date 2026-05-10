CREATE TYPE "public"."lawyer_document_kind" AS ENUM('enrollment_certificate', 'government_id');--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD COLUMN "slug" text;--> statement-breakpoint
UPDATE "lawyer_profile" SET "slug" = 'lawyer-' || substr(md5("user_id"), 1, 16) WHERE "slug" IS NULL;--> statement-breakpoint
ALTER TABLE "lawyer_profile" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD CONSTRAINT "lawyer_profile_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD COLUMN "headline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD COLUMN "bio" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD COLUMN "practice_areas" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD COLUMN "languages" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD COLUMN "years_experience" integer;--> statement-breakpoint
ALTER TABLE "lawyer_profile" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
CREATE TABLE "lawyer_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" "lawyer_document_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer NOT NULL,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyer_document" ADD CONSTRAINT "lawyer_document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_availability" ADD CONSTRAINT "lawyer_availability_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lawyer_document_user_id_idx" ON "lawyer_document" ("user_id");--> statement-breakpoint
CREATE INDEX "lawyer_availability_user_id_idx" ON "lawyer_availability" ("user_id");--> statement-breakpoint
CREATE INDEX "lawyer_profile_verification_status_idx" ON "lawyer_profile" ("verification_status");
