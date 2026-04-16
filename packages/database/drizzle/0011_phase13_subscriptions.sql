CREATE TYPE "public"."kb_plan_period" AS ENUM('month');--> statement-breakpoint
CREATE TYPE "public"."kb_subscription_status" AS ENUM('active', 'past_due', 'cancelled', 'pending', 'paused');--> statement-breakpoint
CREATE TYPE "public"."kb_billing_provider" AS ENUM('razorpay');--> statement-breakpoint

CREATE TABLE "kb_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"price_inr" integer DEFAULT 0 NOT NULL,
	"period" "kb_plan_period" DEFAULT 'month' NOT NULL,
	"razorpay_plan_id" text,
	"limits_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_plan_key_unique" UNIQUE("key")
);--> statement-breakpoint

CREATE TABLE "kb_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "kb_subscription_status" DEFAULT 'pending' NOT NULL,
	"razorpay_subscription_id" text,
	"current_period_start_at" timestamp with time zone,
	"current_period_end_at" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_subscription_razorpay_subscription_id_unique" UNIQUE("razorpay_subscription_id")
);--> statement-breakpoint
ALTER TABLE "kb_subscription" ADD CONSTRAINT "kb_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kb_subscription" ADD CONSTRAINT "kb_subscription_plan_id_kb_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."kb_plan"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kb_subscription_user_status_idx" ON "kb_subscription" USING btree ("user_id","status");--> statement-breakpoint

CREATE TABLE "kb_usage_meter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"meter_key" text NOT NULL,
	"period_start_at" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_usage_meter_user_meter_period_uidx" UNIQUE("user_id","meter_key","period_start_at")
);--> statement-breakpoint
ALTER TABLE "kb_usage_meter" ADD CONSTRAINT "kb_usage_meter_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kb_usage_meter_user_meter_idx" ON "kb_usage_meter" USING btree ("user_id","meter_key");--> statement-breakpoint

CREATE TABLE "kb_billing_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "kb_billing_provider" DEFAULT 'razorpay' NOT NULL,
	"provider_event_id" text NOT NULL,
	"type" text NOT NULL,
	"user_id" text,
	"subscription_id" text,
	"amount_inr" integer,
	"currency" text,
	"occurred_at" timestamp with time zone,
	"payload_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_billing_event_provider_event_unique" UNIQUE("provider","provider_event_id")
);--> statement-breakpoint
ALTER TABLE "kb_billing_event" ADD CONSTRAINT "kb_billing_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kb_billing_event_user_occ_idx" ON "kb_billing_event" USING btree ("user_id","occurred_at");
