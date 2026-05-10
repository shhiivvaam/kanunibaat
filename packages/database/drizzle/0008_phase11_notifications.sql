CREATE TYPE "public"."kb_push_platform" AS ENUM('expo', 'webpush');--> statement-breakpoint
CREATE TYPE "public"."kb_notification_kind" AS ENUM('hearing_reminder', 'consultation_reminder', 'consultation_message', 'case_update');--> statement-breakpoint
CREATE TYPE "public"."kb_notification_job_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE "push_destination" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"platform" "kb_push_platform" NOT NULL,
	"expo_push_token" text,
	"webpush_endpoint" text,
	"webpush_p256dh" text,
	"webpush_auth" text,
	"device_label" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_destination_expo_push_token_unique" UNIQUE("expo_push_token"),
	CONSTRAINT "push_destination_webpush_endpoint_unique" UNIQUE("webpush_endpoint")
);
--> statement-breakpoint
ALTER TABLE "push_destination" ADD CONSTRAINT "push_destination_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "notification_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" "kb_notification_kind" NOT NULL,
	"dedupe_key" text NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"status" "kb_notification_job_status" DEFAULT 'pending' NOT NULL,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_job_dedupe_key_unique" UNIQUE("dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "notification_job" ADD CONSTRAINT "notification_job_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_job_due_idx" ON "notification_job" USING btree ("status","scheduled_at");--> statement-breakpoint
CREATE INDEX "push_destination_user_id_enabled_idx" ON "push_destination" USING btree ("user_id","enabled");
