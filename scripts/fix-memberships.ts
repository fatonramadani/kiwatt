import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import { config } from "dotenv";
import * as schema from "../src/server/db/schema";

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const conn = postgres(DATABASE_URL);
const db = drizzle(conn, { schema });

async function fix() {
  // Find the user
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, "faton.ramadani14@gmail.com"),
  });

  if (!user) {
    console.log("User not found");
    process.exit(1);
  }

  console.log("User:", user.name);

  // Find all memberships for this user in Pompaples
  const pompaplesOrg = await db.query.organization.findFirst({
    where: eq(schema.organization.slug, "pompaples"),
  });

  if (!pompaplesOrg) {
    console.log("Pompaples org not found");
    process.exit(1);
  }

  const memberships = await db.query.organizationMember.findMany({
    where: and(
      eq(schema.organizationMember.userId, user.id),
      eq(schema.organizationMember.organizationId, pompaplesOrg.id)
    ),
  });

  console.log(`\nFound ${memberships.length} memberships for Pompaples:`);
  for (const m of memberships) {
    console.log(`  - ID: ${m.id}, Role: ${m.role}, POD: ${m.podNumber}`);
  }

  if (memberships.length > 1) {
    // Keep the admin one, delete the member one
    const adminMembership = memberships.find(m => m.role === "admin");
    const memberMembership = memberships.find(m => m.role === "member");

    if (adminMembership && memberMembership) {
      console.log(`\nDeleting duplicate 'member' membership (ID: ${memberMembership.id})...`);
      await db.delete(schema.organizationMember).where(
        eq(schema.organizationMember.id, memberMembership.id)
      );
      console.log("✅ Duplicate removed");
    }
  }

  // Verify final state
  const finalMemberships = await db.query.organizationMember.findMany({
    where: eq(schema.organizationMember.userId, user.id),
    with: {
      organization: true,
    },
  });

  console.log("\n📊 Final memberships:");
  for (const m of finalMemberships) {
    console.log(`  - ${m.organization.name} (${m.organization.slug}) - Role: ${m.role}`);
  }

  await conn.end();
}

fix().catch(console.error);
