import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const conn = postgres(DATABASE_URL);
const db = drizzle(conn);

async function migrate() {
  console.log("Adding API key columns to organization_member table...\n");

  try {
    await db.execute(sql`
      ALTER TABLE organization_member
      ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE
    `);
    console.log("✅ Added api_key column");

    await db.execute(sql`
      ALTER TABLE organization_member
      ADD COLUMN IF NOT EXISTS api_key_created_at TIMESTAMP
    `);
    console.log("✅ Added api_key_created_at column");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS member_api_key_idx
      ON organization_member (api_key)
    `);
    console.log("✅ Created index on api_key");

    console.log("\n🎉 Migration complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }

  await conn.end();
}

migrate();
