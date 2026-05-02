-- Add 'task_assigned' to kb_notification_kind enum
ALTER TYPE kb_notification_kind ADD VALUE 'task_assigned';--> statement-breakpoint

-- Migration: P2-11 Business Logic Hardening - Add task assignment notification kind
-- This allows sending notifications when tasks are assigned to users
