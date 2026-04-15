CREATE TYPE "public"."consultation_mode" AS ENUM('chat', 'audio', 'video');--> statement-breakpoint
CREATE TYPE "public"."consultation_status" AS ENUM('pending_payment', 'scheduled', 'in_progress', 'completed', 'cancelled', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'paid', 'failed', 'refunded', 'released');--> statement-breakpoint
CREATE TABLE "consultation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"lawyer_user_id" text NOT NULL,
	"mode" "consultation_mode" NOT NULL,
	"status" "consultation_status" DEFAULT 'pending_payment' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"issue_summary" text DEFAULT '' NOT NULL,
	"amount_inr" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"amount_inr" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"razorpay_order_id" text,
	"razorpay_payment_id" text,
	"razorpay_signature" text,
	"paid_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_razorpay_order_id_unique" UNIQUE("razorpay_order_id"),
	CONSTRAINT "payment_razorpay_payment_id_unique" UNIQUE("razorpay_payment_id")
);
--> statement-breakpoint
CREATE TABLE "consultation_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"sender_user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation" ADD CONSTRAINT "consultation_lawyer_user_id_user_id_fk" FOREIGN KEY ("lawyer_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_consultation_id_consultation_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_message" ADD CONSTRAINT "consultation_message_consultation_id_consultation_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_message" ADD CONSTRAINT "consultation_message_sender_user_id_user_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "consultation_user_id_idx" ON "consultation" ("user_id");--> statement-breakpoint
CREATE INDEX "consultation_lawyer_user_id_idx" ON "consultation" ("lawyer_user_id");--> statement-breakpoint
CREATE INDEX "consultation_status_idx" ON "consultation" ("status");--> statement-breakpoint
CREATE INDEX "payment_consultation_id_idx" ON "payment" ("consultation_id");--> statement-breakpoint
CREATE INDEX "consultation_message_consultation_id_idx" ON "consultation_message" ("consultation_id");
