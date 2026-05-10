CREATE TYPE "public"."kb_qa_question_status" AS ENUM('open', 'answered', 'closed', 'hidden');--> statement-breakpoint
CREATE TYPE "public"."kb_qa_vote_value" AS ENUM('up', 'down');--> statement-breakpoint

CREATE TABLE "content_article" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"life_situation" text DEFAULT '' NOT NULL,
	"title_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"body_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"applicable_laws_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_by_user_id" text,
	"published_at" timestamp with time zone,
	"is_published" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_article_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "content_article" ADD CONSTRAINT "content_article_reviewed_by_user_id_user_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_article_publish_idx" ON "content_article" USING btree ("is_published","published_at");--> statement-breakpoint

CREATE TABLE "qa_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asker_user_id" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"is_anonymous" boolean DEFAULT true NOT NULL,
	"status" "kb_qa_question_status" DEFAULT 'open' NOT NULL,
	"ai_preview_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qa_question" ADD CONSTRAINT "qa_question_asker_user_id_user_id_fk" FOREIGN KEY ("asker_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "qa_question_category_created_idx" ON "qa_question" USING btree ("category","created_at");--> statement-breakpoint

CREATE TABLE "qa_answer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"author_user_id" text NOT NULL,
	"body" text NOT NULL,
	"is_best" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "qa_answer" ADD CONSTRAINT "qa_answer_question_id_qa_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."qa_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_answer" ADD CONSTRAINT "qa_answer_author_user_id_user_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "qa_answer_question_id_idx" ON "qa_answer" USING btree ("question_id");--> statement-breakpoint

CREATE TABLE "qa_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"voter_user_id" text NOT NULL,
	"value" "kb_qa_vote_value" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "qa_vote_user_question_uidx" UNIQUE("question_id","voter_user_id")
);
--> statement-breakpoint
ALTER TABLE "qa_vote" ADD CONSTRAINT "qa_vote_question_id_qa_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."qa_question"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qa_vote" ADD CONSTRAINT "qa_vote_voter_user_id_user_id_fk" FOREIGN KEY ("voter_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "qa_vote_question_id_idx" ON "qa_vote" USING btree ("question_id");

