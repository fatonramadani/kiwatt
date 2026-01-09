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

async function setSuperAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.log("Usage: npx tsx scripts/set-super-admin.ts <email>");
    console.log("Example: npx tsx scripts/set-super-admin.ts admin@kiwatt.ch");
    process.exit(1);
  }

  console.log(`Setting super admin for: ${email}\n`);

  // Find the user
  const user = await db.query.user.findFirst({
    where: eq(schema.user.email, email),
  });

  if (!user) {
    console.error(`User not found with email: ${email}`);
    process.exit(1);
  }

  // Update to super admin
  await db
    .update(schema.user)
    .set({ isSuperAdmin: true })
    .where(eq(schema.user.id, user.id));

  console.log(`Successfully set ${user.name} (${email}) as super admin!`);
  console.log(`\nYou can now access the admin dashboard at /app/admin`);

  process.exit(0);
}

setSuperAdmin().catch((err) => {
  console.error("Error setting super admin:", err);
  process.exit(1);
});
