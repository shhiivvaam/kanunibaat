CREATE TYPE "public"."vault_document_category" AS ENUM('property', 'family', 'financial', 'wills', 'employment', 'court', 'identity', 'rental', 'business', 'insurance', 'other');--> statement-breakpoint
CREATE TYPE "public"."vault_document_upload_status" AS ENUM('pending', 'complete');--> statement-breakpoint
CREATE TABLE "vault_folder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"parent_folder_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"folder_id" uuid,
	"category" "vault_document_category" DEFAULT 'other' NOT NULL,
	"display_name" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"storage_key" text NOT NULL,
	"byte_size" integer DEFAULT 0 NOT NULL,
	"content_type" text DEFAULT 'application/octet-stream' NOT NULL,
	"expires_at" timestamp with time zone,
	"upload_status" "vault_document_upload_status" DEFAULT 'pending' NOT NULL,
	"key_wrap_salt" text,
	"wrapped_dek" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vault_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"access_token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vault_share_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
ALTER TABLE "vault_folder" ADD CONSTRAINT "vault_folder_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_folder" ADD CONSTRAINT "vault_folder_parent_folder_id_vault_folder_id_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."vault_folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_document" ADD CONSTRAINT "vault_document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_document" ADD CONSTRAINT "vault_document_folder_id_vault_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."vault_folder"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_share" ADD CONSTRAINT "vault_share_document_id_vault_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."vault_document"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vault_folder_user_id_idx" ON "vault_folder" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vault_document_user_id_idx" ON "vault_document" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vault_document_folder_id_idx" ON "vault_document" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "vault_document_expires_at_idx" ON "vault_document" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "vault_share_document_id_idx" ON "vault_share" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "vault_share_access_token_idx" ON "vault_share" USING btree ("access_token");
