-- Create audit_log table for security-critical action tracking
CREATE TABLE "audit_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES "user"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "metadata" JSONB,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE INDEX "audit_log_user_idx" ON "audit_log"("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");--> statement-breakpoint

-- Migration: P3-14 Business Logic Hardening - Structured audit logging
-- This table tracks security-critical actions:
-- - Payment capture events
-- - DigiLocker OAuth and document access
-- - Bar Council verification attempts
-- - Admin refund actions
