import { NextRequest, NextResponse } from "next/server";
import { eq, and, lt } from "drizzle-orm";
import { db } from "~/server/db";
import { invoice, organization } from "~/server/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cron job to check for overdue invoices and update their status
 * This runs daily at 8:00 AM (configured in vercel.json)
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (if set)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all "sent" invoices where dueDate < today
    const overdueInvoices = await db
      .update(invoice)
      .set({
        status: "overdue",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(invoice.status, "sent"),
          lt(invoice.dueDate, today)
        )
      )
      .returning({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        organizationId: invoice.organizationId,
        memberId: invoice.memberId,
      });

    console.log(`[Cron] Marked ${overdueInvoices.length} invoices as overdue`);

    // Get organization details for each overdue invoice (for logging/notifications)
    const orgIds = [...new Set(overdueInvoices.map((inv) => inv.organizationId))];
    const organizations = await Promise.all(
      orgIds.map(async (orgId) => {
        const org = await db.query.organization.findFirst({
          where: eq(organization.id, orgId),
        });
        return org;
      })
    );

    const orgMap = new Map(organizations.filter(Boolean).map((o) => [o!.id, o!.name]));

    // Log details
    for (const inv of overdueInvoices) {
      const orgName = orgMap.get(inv.organizationId) ?? "Unknown";
      console.log(`[Cron] Invoice ${inv.invoiceNumber} (${orgName}) marked as overdue`);
    }

    return NextResponse.json({
      success: true,
      overdueCount: overdueInvoices.length,
      details: overdueInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        organization: orgMap.get(inv.organizationId),
      })),
    });
  } catch (error) {
    console.error("[Cron] Error checking overdue invoices:", error);
    return NextResponse.json(
      { error: "Failed to check overdue invoices" },
      { status: 500 }
    );
  }
}
