CREATE TYPE "public"."timbre_reduction" AS ENUM('20', '40');--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "timbre_reduction" "timbre_reduction" DEFAULT '20' NOT NULL;