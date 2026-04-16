CREATE TABLE "case_tracker" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"cnr" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_snapshot_hash" text,
	"last_snapshot_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"next_check_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "case_tracker" ADD CONSTRAINT "case_tracker_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "case_tracker_user_cnr_uidx" ON "case_tracker" USING btree ("user_id","cnr");--> statement-breakpoint
CREATE INDEX "case_tracker_due_idx" ON "case_tracker" USING btree ("enabled","next_check_at");

