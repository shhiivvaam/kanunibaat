CREATE TYPE "public"."digilocker_connection_status" AS ENUM('connected', 'revoked', 'error');--> statement-breakpoint

CREATE TABLE "digilocker_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"status" "public"."digilocker_connection_status" DEFAULT 'connected' NOT NULL,
	"access_token_enc" text NOT NULL,
	"refresh_token_enc" text NOT NULL,
	"expires_at" timestamp with time zone,
	"scopes_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "digilocker_connection" ADD CONSTRAINT "digilocker_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "digilocker_connection_user_uidx" ON "digilocker_connection" USING btree ("user_id");--> statement-breakpoint

CREATE TABLE "digilocker_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connection_id" uuid NOT NULL,
	"doc_id" text NOT NULL,
	"issuer" text DEFAULT '' NOT NULL,
	"doc_type" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"mime" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"vault_document_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "digilocker_document" ADD CONSTRAINT "digilocker_document_connection_id_digilocker_connection_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."digilocker_connection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "digilocker_document" ADD CONSTRAINT "digilocker_document_vault_document_id_vault_document_id_fk" FOREIGN KEY ("vault_document_id") REFERENCES "public"."vault_document"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "digilocker_document_conn_doc_uidx" ON "digilocker_document" USING btree ("connection_id","doc_id");

