ALTER TABLE "organization_member" ADD COLUMN "api_key" text;--> statement-breakpoint
ALTER TABLE "organization_member" ADD COLUMN "api_key_created_at" timestamp;--> statement-breakpoint
CREATE INDEX "member_api_key_idx" ON "organization_member" USING btree ("api_key");--> statement-breakpoint
ALTER TABLE "organization_member" ADD CONSTRAINT "organization_member_api_key_unique" UNIQUE("api_key");