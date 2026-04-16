CREATE TYPE "public"."lawyer_court_type" AS ENUM('district', 'high_court', 'supreme_court', 'tribunal', 'other');--> statement-breakpoint
CREATE TYPE "public"."lawyer_case_status" AS ENUM('intake', 'active', 'hearing_scheduled', 'pending_docs', 'judgement', 'closed', 'appealed');--> statement-breakpoint
CREATE TYPE "public"."lawyer_case_task_priority" AS ENUM('low', 'normal', 'high');--> statement-breakpoint
CREATE TYPE "public"."lawyer_case_task_status" AS ENUM('open', 'done');--> statement-breakpoint
CREATE TYPE "public"."lawyer_case_document_upload_status" AS ENUM('pending', 'complete');--> statement-breakpoint
CREATE TABLE "lawyer_client" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lawyer_user_id" text NOT NULL,
	"platform_user_id" text,
	"display_name" text NOT NULL,
	"phone" text,
	"email" text,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_case" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lawyer_user_id" text NOT NULL,
	"lawyer_client_id" uuid,
	"client_display_name" text,
	"court_case_number" text,
	"cnr_number" text,
	"court_name" text DEFAULT '' NOT NULL,
	"court_type" "lawyer_court_type" DEFAULT 'other' NOT NULL,
	"state" text DEFAULT '' NOT NULL,
	"district" text DEFAULT '' NOT NULL,
	"case_type" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "lawyer_case_status" DEFAULT 'intake' NOT NULL,
	"opposing_party" text,
	"next_hearing_at" timestamp with time zone,
	"fee_agreed_inr" integer,
	"outcome" text,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_case_hearing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"hearing_at" timestamp with time zone NOT NULL,
	"court_room" text,
	"judge_name" text,
	"what_happened" text,
	"next_hearing_at" timestamp with time zone,
	"action_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_case_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"title" text NOT NULL,
	"due_at" timestamp with time zone,
	"priority" "lawyer_case_task_priority" DEFAULT 'normal' NOT NULL,
	"task_status" "lawyer_case_task_status" DEFAULT 'open' NOT NULL,
	"assignee_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lawyer_case_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"uploaded_by_user_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"byte_size" integer DEFAULT 0 NOT NULL,
	"visible_to_client" boolean DEFAULT false NOT NULL,
	"upload_status" "lawyer_case_document_upload_status" DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyer_client" ADD CONSTRAINT "lawyer_client_lawyer_user_id_user_id_fk" FOREIGN KEY ("lawyer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_client" ADD CONSTRAINT "lawyer_client_platform_user_id_user_id_fk" FOREIGN KEY ("platform_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_case" ADD CONSTRAINT "lawyer_case_lawyer_user_id_user_id_fk" FOREIGN KEY ("lawyer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_case" ADD CONSTRAINT "lawyer_case_lawyer_client_id_lawyer_client_id_fk" FOREIGN KEY ("lawyer_client_id") REFERENCES "public"."lawyer_client"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_case_hearing" ADD CONSTRAINT "lawyer_case_hearing_case_id_lawyer_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."lawyer_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_case_task" ADD CONSTRAINT "lawyer_case_task_case_id_lawyer_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."lawyer_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_case_task" ADD CONSTRAINT "lawyer_case_task_assignee_user_id_user_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_case_document" ADD CONSTRAINT "lawyer_case_document_case_id_lawyer_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."lawyer_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_case_document" ADD CONSTRAINT "lawyer_case_document_uploaded_by_user_id_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lawyer_client_lawyer_user_id_idx" ON "lawyer_client" USING btree ("lawyer_user_id");--> statement-breakpoint
CREATE INDEX "lawyer_case_lawyer_user_id_idx" ON "lawyer_case" USING btree ("lawyer_user_id");--> statement-breakpoint
CREATE INDEX "lawyer_case_lawyer_user_id_next_hearing_idx" ON "lawyer_case" USING btree ("lawyer_user_id", "next_hearing_at");--> statement-breakpoint
CREATE INDEX "lawyer_case_hearing_case_id_idx" ON "lawyer_case_hearing" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "lawyer_case_hearing_hearing_at_idx" ON "lawyer_case_hearing" USING btree ("hearing_at");--> statement-breakpoint
CREATE INDEX "lawyer_case_task_case_id_idx" ON "lawyer_case_task" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "lawyer_case_task_due_at_idx" ON "lawyer_case_task" USING btree ("due_at");--> statement-breakpoint
CREATE INDEX "lawyer_case_document_case_id_idx" ON "lawyer_case_document" USING btree ("case_id");
