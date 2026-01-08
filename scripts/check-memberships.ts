import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import { config } from "dotenv";
import * as schema from "../src/server/db/schema";

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const conn = postgres(DATABASE_URL);
const db = drizzle(conn, { schema });

async function check() {
  // Find the user
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, "faton.ramadani14@gmail.com"),
  });

  if (!user) {
    console.log("User not found");
    process.exit(1);
  }

  console.log("User:", user.name, user.id);

  // Find all memberships for this user
  const memberships = await db.query.organizationMember.findMany({
    where: eq(schema.organizationMember.userId, user.id),
    with: {
      organization: true,
    },
  });

  console.log("\nMemberships:", memberships.length);
  for (const m of memberships) {
    console.log(`  - ${m.organization.name} (${m.organization.slug}) - Role: ${m.role}`);
  }

  await conn.end();
}

check().catch(console.error);
