CREATE TYPE "public"."whatsapp_message_direction" AS ENUM('in', 'out');--> statement-breakpoint

CREATE TABLE "whatsapp_conversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"wa_user_id" text NOT NULL,
	"last_state" text DEFAULT 'entry' NOT NULL,
	"last_locale" text DEFAULT 'en' NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "whatsapp_conversation" ADD CONSTRAINT "whatsapp_conversation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_conversation_wa_user_uidx" ON "whatsapp_conversation" USING btree ("wa_user_id");--> statement-breakpoint

CREATE TABLE "whatsapp_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"wa_message_id" text NOT NULL,
	"direction" "public"."whatsapp_message_direction" NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"raw_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "whatsapp_message" ADD CONSTRAINT "whatsapp_message_conversation_id_whatsapp_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "whatsapp_message_wa_message_uidx" ON "whatsapp_message" USING btree ("wa_message_id");--> statement-breakpoint
CREATE INDEX "whatsapp_message_conversation_created_idx" ON "whatsapp_message" USING btree ("conversation_id","created_at");

