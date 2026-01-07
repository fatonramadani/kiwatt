CREATE TYPE "public"."payment_method" AS ENUM('bank_transfer', 'cash', 'other');--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "payment_reference" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "payment_notes" text;