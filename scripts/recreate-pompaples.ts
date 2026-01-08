import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createId } from "@paralleldrive/cuid2";
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

// Swiss first and last names for realistic data
const firstNames = [
  "Jean", "Pierre", "Marie", "Sophie", "Marc", "Claire", "François", "Anne",
  "Philippe", "Catherine", "Laurent", "Isabelle", "Nicolas", "Nathalie", "Michel",
  "Christine", "Olivier", "Monique", "Alain", "Sylvie", "Patrick", "Véronique",
  "Thierry", "Martine", "Christophe"
];

const lastNames = [
  "Müller", "Favre", "Rochat", "Blanc", "Martin", "Bernard", "Dubois", "Morel",
  "Laurent", "Simon", "Michel", "Lefèvre", "Leroy", "Roux", "David", "Bertrand",
  "Moreau", "Fournier", "Girard", "Bonnet", "Dupont", "Lambert", "Fontaine",
  "Rousseau", "Vincent"
];

// Streets in Pompaples area
const streets = [
  "Rue du Village", "Chemin des Prés", "Route de Lausanne", "Rue de la Gare",
  "Chemin des Vignes", "Rue du Château", "Avenue de la Liberté", "Chemin du Lac",
  "Rue des Alpes", "Route de Genève", "Chemin des Champs", "Rue de l'Église",
  "Avenue du Midi", "Chemin des Bois", "Rue de la Poste"
];

async function recreate() {
  console.log("🗑️  Deleting existing Pompaples CEL...\n");

  // Find and delete existing Pompaples org
  const existingOrg = await db.query.organization.findFirst({
    where: eq(schema.organization.slug, "pompaples"),
  });

  if (existingOrg) {
    // Delete in order: invites -> aggregations -> load curves -> invoices -> invoice lines -> tariffs -> members -> org
    console.log("  Deleting member invites...");
    const members = await db.query.organizationMember.findMany({
      where: eq(schema.organizationMember.organizationId, existingOrg.id),
    });
    for (const m of members) {
      await db.delete(schema.memberInvite).where(eq(schema.memberInvite.memberId, m.id));
    }

    console.log("  Deleting monthly aggregations...");
    await db.delete(schema.monthlyAggregation).where(eq(schema.monthlyAggregation.organizationId, existingOrg.id));

    console.log("  Deleting load curves...");
    await db.delete(schema.loadCurve).where(eq(schema.loadCurve.organizationId, existingOrg.id));

    console.log("  Deleting invoices...");
    const invoices = await db.query.invoice.findMany({
      where: eq(schema.invoice.organizationId, existingOrg.id),
    });
    for (const inv of invoices) {
      await db.delete(schema.invoiceLine).where(eq(schema.invoiceLine.invoiceId, inv.id));
    }
    await db.delete(schema.invoice).where(eq(schema.invoice.organizationId, existingOrg.id));

    console.log("  Deleting platform invoices...");
    await db.delete(schema.platformInvoice).where(eq(schema.platformInvoice.organizationId, existingOrg.id));

    console.log("  Deleting tariffs...");
    await db.delete(schema.tariffPlan).where(eq(schema.tariffPlan.organizationId, existingOrg.id));

    console.log("  Deleting members...");
    await db.delete(schema.organizationMember).where(eq(schema.organizationMember.organizationId, existingOrg.id));

    console.log("  Deleting organization...");
    await db.delete(schema.organization).where(eq(schema.organization.id, existingOrg.id));

    console.log("✅ Existing Pompaples CEL deleted\n");
  } else {
    console.log("  No existing Pompaples CEL found\n");
  }

  // Now recreate
  console.log("🌱 Creating new Pompaples CEL...\n");

  // 1. Find the user
  const adminUser = await db.query.user.findFirst({
    where: eq(schema.user.email, "faton.ramadani14@gmail.com"),
  });

  if (!adminUser) {
    console.log("❌ User faton.ramadani14@gmail.com not found. Please register first.");
    process.exit(1);
  }

  console.log(`✅ Found admin user: ${adminUser.name} (${adminUser.email})`);

  // 2. Create the organization
  const orgId = createId();
  const orgSlug = "pompaples";

  await db.insert(schema.organization).values({
    id: orgId,
    name: "CEL de Pompaples",
    slug: orgSlug,
    address: "Place du Village 1",
    postalCode: "1318",
    city: "Pompaples",
    commune: "Pompaples",
    canton: "VD",
    contactEmail: "cel@pompaples.ch",
    contactPhone: "+41 21 866 00 00",
    distributionStrategy: "prorata",
    timbreReduction: "20",
    billingSettings: {
      currency: "CHF",
      vatRate: 8.1,
      paymentTermDays: 30,
      iban: "CH93 0076 2011 6238 5295 7",
      payeeName: "CEL de Pompaples",
      payeeAddress: "Place du Village 1",
      payeeZip: "1318",
      payeeCity: "Pompaples",
      payeeCountry: "CH",
    },
  });

  console.log(`✅ Created organization: CEL de Pompaples (${orgSlug})`);

  // 3. Create tariff plan
  const tariffId = createId();
  await db.insert(schema.tariffPlan).values({
    id: tariffId,
    organizationId: orgId,
    name: "Tarif Standard 2025",
    communityRateChfKwh: "0.18",
    gridRateChfKwh: "0.25",
    injectionRateChfKwh: "0.08",
    monthlyFeeChf: "5.00",
    vatRate: "8.10",
    validFrom: new Date("2025-01-01"),
    isDefault: true,
  });

  console.log("✅ Created tariff plan: Tarif Standard 2025");

  // 4. Create admin member (linked to user)
  const adminMemberId = createId();
  await db.insert(schema.organizationMember).values({
    id: adminMemberId,
    organizationId: orgId,
    userId: adminUser.id,
    role: "admin",
    firstname: adminUser.name.split(" ")[0] ?? "Faton",
    lastname: adminUser.name.split(" ")[1] ?? "Ramadani",
    email: adminUser.email,
    address: "Place du Village 1",
    postalCode: "1318",
    city: "Pompaples",
    podNumber: "CH-POD-VD-1318-001",
    installationType: "prosumer",
    solarCapacityKwp: "12.5",
    batteryCapacityKwh: "10.0",
    status: "active",
    priorityLevel: 1,
  });

  console.log(`✅ Created admin member: ${adminUser.name}`);

  // 5. Create 24 additional members
  const memberData: Array<{
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    address: string;
    podNumber: string;
    installationType: "consumer" | "producer" | "prosumer";
    solarCapacity: string | null;
    batteryCapacity: string | null;
  }> = [];

  for (let i = 0; i < 24; i++) {
    const firstname = firstNames[i]!;
    const lastname = lastNames[i]!;
    const street = streets[i % streets.length]!;
    const streetNum = Math.floor(Math.random() * 50) + 1;

    let installationType: "consumer" | "producer" | "prosumer";
    let solarCapacity: string | null = null;
    let batteryCapacity: string | null = null;

    if (i < 8) {
      installationType = "prosumer";
      solarCapacity = (Math.random() * 15 + 5).toFixed(1);
      batteryCapacity = Math.random() > 0.5 ? (Math.random() * 10 + 5).toFixed(1) : null;
    } else if (i < 12) {
      installationType = "producer";
      solarCapacity = (Math.random() * 20 + 10).toFixed(1);
    } else {
      installationType = "consumer";
    }

    memberData.push({
      id: createId(),
      firstname,
      lastname,
      email: `${firstname.toLowerCase()}.${lastname.toLowerCase()}@example.ch`,
      address: `${street} ${streetNum}`,
      podNumber: `CH-POD-VD-1318-${String(i + 2).padStart(3, "0")}`,
      installationType,
      solarCapacity,
      batteryCapacity,
    });
  }

  await db.insert(schema.organizationMember).values(
    memberData.map((m) => ({
      id: m.id,
      organizationId: orgId,
      role: "member" as const,
      firstname: m.firstname,
      lastname: m.lastname,
      email: m.email,
      address: m.address,
      postalCode: "1318",
      city: "Pompaples",
      podNumber: m.podNumber,
      installationType: m.installationType,
      solarCapacityKwp: m.solarCapacity,
      batteryCapacityKwh: m.batteryCapacity,
      status: "active" as const,
      priorityLevel: 5,
    }))
  );

  console.log(`✅ Created ${memberData.length} members`);

  // 6. Create monthly aggregation data for Nov 2025, Dec 2025, Jan 2026
  const allMembers = [
    { id: adminMemberId, installationType: "prosumer" as const },
    ...memberData.map((m) => ({ id: m.id, installationType: m.installationType })),
  ];

  const months = [
    { year: 2025, month: 11, seasonFactor: 0.35 },  // November - low sun
    { year: 2025, month: 12, seasonFactor: 0.25 },  // December - winter
    { year: 2026, month: 1, seasonFactor: 0.30 },   // January - still winter
  ];

  let aggregationCount = 0;

  for (const { year, month, seasonFactor } of months) {
    for (const member of allMembers) {
      // Base consumption (higher in winter: 400-900 kWh/month)
      const baseConsumption = Math.random() * 500 + 400;

      // Production based on installation type and season
      let production = 0;
      if (member.installationType === "prosumer") {
        production = (Math.random() * 300 + 100) * seasonFactor;
      } else if (member.installationType === "producer") {
        production = (Math.random() * 600 + 300) * seasonFactor;
      }

      // Calculate consumption breakdown
      const selfConsumption = Math.min(production * 0.35, baseConsumption * 0.3);
      const communityConsumption = Math.min(
        (baseConsumption - selfConsumption) * 0.5,
        production * 0.35
      );
      const gridConsumption = Math.max(
        0,
        baseConsumption - selfConsumption - communityConsumption
      );

      // Calculate export breakdown
      const exportedToCommunity = Math.max(0, (production - selfConsumption) * 0.6);
      const exportedToGrid = Math.max(0, production - selfConsumption - exportedToCommunity);

      await db.insert(schema.monthlyAggregation).values({
        id: createId(),
        organizationId: orgId,
        memberId: member.id,
        year,
        month,
        totalConsumptionKwh: baseConsumption.toFixed(4),
        totalProductionKwh: production.toFixed(4),
        selfConsumptionKwh: selfConsumption.toFixed(4),
        communityConsumptionKwh: communityConsumption.toFixed(4),
        gridConsumptionKwh: gridConsumption.toFixed(4),
        exportedToCommunityKwh: exportedToCommunity.toFixed(4),
        exportedToGridKwh: exportedToGrid.toFixed(4),
      });

      aggregationCount++;
    }
  }

  console.log(`✅ Created ${aggregationCount} monthly aggregation records (3 months × 25 members)`);

  // 7. Generate member invite tokens
  console.log("\n📧 Member Portal Access Links:\n");
  console.log("=".repeat(80));

  const invites: Array<{ name: string; email: string; token: string; link: string }> = [];

  for (const member of memberData.slice(0, 10)) {
    const token = createId() + createId();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(schema.memberInvite).values({
      id: createId(),
      memberId: member.id,
      token,
      expiresAt,
    });

    const link = `http://localhost:3000/portal/invite/${token}`;
    invites.push({
      name: `${member.firstname} ${member.lastname}`,
      email: member.email,
      token,
      link,
    });
  }

  for (const invite of invites) {
    console.log(`${invite.name}`);
    console.log(`  Email: ${invite.email}`);
    console.log(`  Link:  ${invite.link}`);
    console.log("");
  }

  console.log("=".repeat(80));
  console.log("\n✅ Pompaples CEL recreated successfully!\n");
  console.log("📊 Summary:");
  console.log(`   - Organization: CEL de Pompaples`);
  console.log(`   - Admin Portal: http://localhost:3000/app/${orgSlug}/dashboard`);
  console.log(`   - Member Portal: http://localhost:3000/portal/${orgSlug}`);
  console.log(`   - Members: 25 (1 admin + 24 members)`);
  console.log(`   - Energy data: November 2025, December 2025, January 2026`);
  console.log(`   - Invite links generated for 10 members (valid 30 days)`);

  await conn.end();
}

recreate().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
