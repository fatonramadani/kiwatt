import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { platformInvoice, user } from "~/server/db/schema";
import { generatePlatformInvoicePdf } from "~/lib/pdf/generate-platform-invoice-pdf";
import type { PlatformInvoiceData } from "~/lib/pdf/platform-invoice-template";
import { auth } from "~/server/better-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;

    // Get user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (!currentUser?.isSuperAdmin) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    // Fetch platform invoice with organization
    const inv = await db.query.platformInvoice.findFirst({
      where: eq(platformInvoice.id, invoiceId),
      with: {
        organization: true,
      },
    });

    if (!inv) {
      return NextResponse.json(
        { error: "Platform invoice not found" },
        { status: 404 }
      );
    }

    // Transform to PlatformInvoiceData format
    const invoiceData: PlatformInvoiceData = {
      invoiceNumber: inv.invoiceNumber,
      createdAt: inv.createdAt,
      dueDate: inv.dueDate,
      year: inv.year,
      month: inv.month,
      status: inv.status,
      totalKwhManaged: parseFloat(inv.totalKwhManaged),
      ratePerKwh: parseFloat(inv.ratePerKwh),
      calculatedAmount: parseFloat(inv.calculatedAmount),
      minimumAmount: parseFloat(inv.minimumAmount),
      finalAmount: parseFloat(inv.finalAmount),
      vatRate: parseFloat(inv.vatRate),
      vatAmount: parseFloat(inv.vatAmount),
      totalAmount: parseFloat(inv.totalAmount),
      organization: {
        name: inv.organization.name,
        address: inv.organization.address,
        postalCode: inv.organization.postalCode,
        city: inv.organization.city,
        contactEmail: inv.organization.contactEmail,
      },
    };

    // Generate PDF
    const pdfBuffer = await generatePlatformInvoicePdf(invoiceData);

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-plateforme-${inv.invoiceNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating platform invoice PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
