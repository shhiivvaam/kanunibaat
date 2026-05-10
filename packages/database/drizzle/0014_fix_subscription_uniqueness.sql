-- Add unique partial index to prevent multiple active subscriptions per user
CREATE UNIQUE INDEX "kb_subscription_active_user_uidx" ON "kb_subscription" ("user_id") WHERE status = 'active';--> statement-breakpoint

-- Add migration metadata comment
-- Migration: P0-2 Business Logic Hardening - Prevent duplicate active subscriptions
-- This ensures each user can only have one active subscription at a time
-- Past subscriptions (cancelled, past_due, paused) can coexist with no restriction
