CREATE TYPE "public"."platform_invoice_status" AS ENUM('draft', 'sent', 'paid');--> statement-breakpoint
CREATE TABLE "member_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "member_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "platform_invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"total_kwh_managed" numeric(12, 2) NOT NULL,
	"rate_per_kwh" numeric(6, 4) DEFAULT '0.005' NOT NULL,
	"calculated_amount" numeric(10, 2) NOT NULL,
	"minimum_amount" numeric(10, 2) DEFAULT '49.00' NOT NULL,
	"final_amount" numeric(10, 2) NOT NULL,
	"vat_rate" numeric(4, 2) DEFAULT '8.1' NOT NULL,
	"vat_amount" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" "platform_invoice_status" DEFAULT 'draft' NOT NULL,
	"pdf_url" text,
	"due_date" timestamp NOT NULL,
	"sent_at" timestamp,
	"paid_at" timestamp,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member_invite" ADD CONSTRAINT "member_invite_member_id_organization_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."organization_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_invoice" ADD CONSTRAINT "platform_invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invite_member_idx" ON "member_invite" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invite_token_idx" ON "member_invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "platform_invoice_org_idx" ON "platform_invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "platform_invoice_org_period_idx" ON "platform_invoice" USING btree ("organization_id","year","month");