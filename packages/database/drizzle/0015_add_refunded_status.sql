-- Add 'refunded' status to lawyer_invoice_payment_status enum
ALTER TYPE lawyer_invoice_payment_status ADD VALUE 'refunded';--> statement-breakpoint

-- Migration: P2-12 Business Logic Hardening - Add refund status to lawyer invoice payment
-- This allows webhook handlers to properly update payment status when refunds are processed
