CREATE TYPE "public"."lawyer_case_outcome" AS ENUM('unknown', 'won', 'lost', 'settled', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."lawyer_invoice_status" AS ENUM('draft', 'sent', 'partially_paid', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."lawyer_invoice_supply_type" AS ENUM('intrastate', 'interstate');--> statement-breakpoint
CREATE TYPE "public"."lawyer_invoice_line_kind" AS ENUM('consultation', 'hearing', 'drafting', 'time', 'misc');--> statement-breakpoint
CREATE TYPE "public"."lawyer_invoice_payment_status" AS ENUM('created', 'paid', 'failed');--> statement-breakpoint
ALTER TABLE "lawyer_client" ADD COLUMN "referral_source" text;--> statement-breakpoint
ALTER TABLE "lawyer_case" ADD COLUMN "case_outcome" "lawyer_case_outcome" DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
CREATE TABLE "lawyer_firm_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"legal_name" text DEFAULT '' NOT NULL,
	"address_line1" text DEFAULT '' NOT NULL,
	"address_line2" text DEFAULT '' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"state_code" text DEFAULT '' NOT NULL,
	"pincode" text DEFAULT '' NOT NULL,
	"gstin" text,
	"pan" text,
	"default_hsn_sac" text DEFAULT '998212' NOT NULL,
	"invoice_prefix" text DEFAULT 'INV' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyer_firm_profile" ADD CONSTRAINT "lawyer_firm_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "lawyer_invoice_counter" (
	"lawyer_user_id" text NOT NULL,
	"fy_start_year" integer NOT NULL,
	"last_sequence" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lawyer_invoice_counter_pkey" PRIMARY KEY("lawyer_user_id","fy_start_year")
);
--> statement-breakpoint
ALTER TABLE "lawyer_invoice_counter" ADD CONSTRAINT "lawyer_invoice_counter_lawyer_user_id_user_id_fk" FOREIGN KEY ("lawyer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "lawyer_invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lawyer_user_id" text NOT NULL,
	"case_id" uuid,
	"consultation_id" uuid,
	"invoice_number" text NOT NULL,
	"status" "lawyer_invoice_status" DEFAULT 'draft' NOT NULL,
	"supply_type" "lawyer_invoice_supply_type" DEFAULT 'intrastate' NOT NULL,
	"client_name" text DEFAULT '' NOT NULL,
	"client_email" text,
	"client_gstin" text,
	"client_address" text DEFAULT '' NOT NULL,
	"place_of_supply" text DEFAULT '' NOT NULL,
	"taxable_inr" integer DEFAULT 0 NOT NULL,
	"cgst_inr" integer DEFAULT 0 NOT NULL,
	"sgst_inr" integer DEFAULT 0 NOT NULL,
	"igst_inr" integer DEFAULT 0 NOT NULL,
	"total_inr" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyer_invoice" ADD CONSTRAINT "lawyer_invoice_lawyer_user_id_user_id_fk" FOREIGN KEY ("lawyer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_invoice" ADD CONSTRAINT "lawyer_invoice_case_id_lawyer_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."lawyer_case"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_invoice" ADD CONSTRAINT "lawyer_invoice_consultation_id_consultation_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultation"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lawyer_invoice_number_uidx" ON "lawyer_invoice" USING btree ("lawyer_user_id","invoice_number");--> statement-breakpoint
CREATE TABLE "lawyer_invoice_line" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"kind" "lawyer_invoice_line_kind" DEFAULT 'misc' NOT NULL,
	"description" text NOT NULL,
	"quantity" double precision DEFAULT 1 NOT NULL,
	"unit_rate_inr" integer NOT NULL,
	"tax_rate_percent" integer DEFAULT 18 NOT NULL,
	"taxable_inr" integer NOT NULL,
	"hsn_sac" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyer_invoice_line" ADD CONSTRAINT "lawyer_invoice_line_invoice_id_lawyer_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."lawyer_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "lawyer_time_entry" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lawyer_user_id" text NOT NULL,
	"case_id" uuid NOT NULL,
	"task_id" uuid,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"notes" text DEFAULT '' NOT NULL,
	"billed_invoice_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lawyer_time_entry" ADD CONSTRAINT "lawyer_time_entry_lawyer_user_id_user_id_fk" FOREIGN KEY ("lawyer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_time_entry" ADD CONSTRAINT "lawyer_time_entry_case_id_lawyer_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."lawyer_case"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_time_entry" ADD CONSTRAINT "lawyer_time_entry_task_id_lawyer_case_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."lawyer_case_task"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lawyer_time_entry" ADD CONSTRAINT "lawyer_time_entry_billed_invoice_id_lawyer_invoice_id_fk" FOREIGN KEY ("billed_invoice_id") REFERENCES "public"."lawyer_invoice"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lawyer_time_entry_one_open_uidx" ON "lawyer_time_entry" ("lawyer_user_id") WHERE "ended_at" IS NULL;--> statement-breakpoint
CREATE TABLE "lawyer_invoice_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount_inr" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" "lawyer_invoice_payment_status" DEFAULT 'created' NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lawyer_invoice_payment_razorpay_order_id_unique" UNIQUE("razorpay_order_id")
);
--> statement-breakpoint
ALTER TABLE "lawyer_invoice_payment" ADD CONSTRAINT "lawyer_invoice_payment_invoice_id_lawyer_invoice_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."lawyer_invoice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lawyer_invoice_lawyer_user_id_idx" ON "lawyer_invoice" USING btree ("lawyer_user_id");--> statement-breakpoint
CREATE INDEX "lawyer_invoice_case_id_idx" ON "lawyer_invoice" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "lawyer_time_entry_case_id_idx" ON "lawyer_time_entry" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "lawyer_time_entry_lawyer_user_id_idx" ON "lawyer_time_entry" USING btree ("lawyer_user_id");--> statement-breakpoint
CREATE INDEX "lawyer_invoice_payment_invoice_id_idx" ON "lawyer_invoice_payment" USING btree ("invoice_id");
