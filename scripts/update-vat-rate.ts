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

async function updateVatRate() {
  console.log("🔄 Updating VAT rate from 7.70% to 8.10%...\n");

  // Get all tariffs with old VAT rate
  const tariffs = await db.query.tariffPlan.findMany({
    where: eq(schema.tariffPlan.vatRate, "7.70"),
  });

  if (tariffs.length === 0) {
    console.log("✅ No tariffs found with 7.70% VAT rate. All up to date!");
    process.exit(0);
  }

  console.log(`Found ${tariffs.length} tariff(s) with 7.70% VAT rate:\n`);
  for (const t of tariffs) {
    console.log(`  - ${t.name} (ID: ${t.id})`);
  }

  // Update all tariffs to new VAT rate
  const result = await db
    .update(schema.tariffPlan)
    .set({
      vatRate: "8.10",
      updatedAt: new Date(),
    })
    .where(eq(schema.tariffPlan.vatRate, "7.70"))
    .returning({ id: schema.tariffPlan.id, name: schema.tariffPlan.name });

  console.log(`\n✅ Updated ${result.length} tariff(s) to 8.10% VAT:`);
  for (const t of result) {
    console.log(`  - ${t.name}`);
  }

  process.exit(0);
}

updateVatRate().catch((err) => {
  console.error("❌ Error updating VAT rate:", err);
  process.exit(1);
});
