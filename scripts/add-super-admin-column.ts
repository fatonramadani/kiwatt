import postgres from "postgres";
import { config } from "dotenv";

config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const sql = postgres(DATABASE_URL);

async function addSuperAdminColumn() {
  console.log("Adding is_super_admin column to user table...\n");

  try {
    // Check if column already exists
    const [existing] = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'user' AND column_name = 'is_super_admin'
    `;

    if (existing) {
      console.log("Column 'is_super_admin' already exists.");
    } else {
      await sql`
        ALTER TABLE "user" ADD COLUMN "is_super_admin" BOOLEAN DEFAULT FALSE
      `;
      console.log("Successfully added 'is_super_admin' column!");
    }

    // Now set super admin if email provided
    const email = process.argv[2];
    if (email) {
      const [user] = await sql`
        UPDATE "user"
        SET is_super_admin = true
        WHERE email = ${email}
        RETURNING name, email
      `;

      if (user) {
        console.log(`\nSet ${user.name} (${user.email}) as super admin!`);
        console.log(`\nYou can now access the admin dashboard at /app/admin`);
      } else {
        console.log(`\nNo user found with email: ${email}`);
      }
    } else {
      console.log("\nTo set a user as super admin, run:");
      console.log("npx tsx scripts/add-super-admin-column.ts your-email@example.com");
    }
  } catch (error) {
    console.error("Error:", error);
  }

  await sql.end();
  process.exit(0);
}

addSuperAdminColumn();
