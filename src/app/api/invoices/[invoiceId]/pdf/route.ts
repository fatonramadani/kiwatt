import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { invoice, organizationMember } from "~/server/db/schema";
import { generateInvoicePdfBuffer } from "~/lib/pdf/generate-invoice-pdf";
import type { InvoiceData } from "~/lib/pdf/invoice-template";
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

    // Fetch invoice with all related data
    const inv = await db.query.invoice.findFirst({
      where: eq(invoice.id, invoiceId),
      with: {
        organization: true,
        member: true,
        lines: {
          orderBy: (lines, { asc }) => [asc(lines.sortOrder)],
        },
      },
    });

    if (!inv) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Authorization: Check if user can access this invoice
    // User must be either: the member on the invoice OR an admin of the organization
    const isInvoiceMember = inv.member.userId === session.user.id;

    let isOrgAdmin = false;
    if (!isInvoiceMember) {
      const membership = await db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, inv.organizationId),
          eq(organizationMember.userId, session.user.id)
        ),
      });
      isOrgAdmin = membership?.role === "admin";
    }

    if (!isInvoiceMember && !isOrgAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Transform to InvoiceData format
    const invoiceData: InvoiceData = {
      invoiceNumber: inv.invoiceNumber,
      createdAt: inv.createdAt,
      dueDate: inv.dueDate,
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      status: inv.status,
      subtotalChf: parseFloat(inv.subtotalChf),
      vatAmountChf: parseFloat(inv.vatAmountChf),
      totalChf: parseFloat(inv.totalChf),
      organization: {
        name: inv.organization.name,
        address: inv.organization.address,
        postalCode: inv.organization.postalCode,
        city: inv.organization.city,
        contactEmail: inv.organization.contactEmail,
        contactPhone: inv.organization.contactPhone,
        billingSettings: inv.organization.billingSettings,
      },
      member: {
        firstname: inv.member.firstname,
        lastname: inv.member.lastname,
        address: inv.member.address,
        postalCode: inv.member.postalCode,
        city: inv.member.city,
        email: inv.member.email,
        podNumber: inv.member.podNumber,
      },
      lines: inv.lines.map((line) => ({
        id: line.id,
        description: line.description,
        quantity: parseFloat(line.quantity),
        unit: line.unit,
        unitPriceChf: parseFloat(line.unitPriceChf),
        totalChf: parseFloat(line.totalChf),
        lineType: line.lineType,
      })),
    };

    // Generate PDF (QR-bill is automatically included if IBAN is configured)
    const pdfBuffer = await generateInvoicePdfBuffer(invoiceData);

    // Return PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${inv.invoiceNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
