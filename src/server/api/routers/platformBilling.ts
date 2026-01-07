import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sum } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  platformInvoice,
  organization,
  organizationMember,
  monthlyAggregation,
} from "~/server/db/schema";

// Pricing constants
const RATE_PER_KWH = 0.005; // CHF per kWh
const MINIMUM_AMOUNT = 49.0; // CHF minimum per month
const VAT_RATE = 8.1; // Switzerland VAT rate

// Helper to verify admin of organization
async function verifyOrgAdmin(
  ctx: { db: any; session: { user: { id: string } } },
  orgId: string
) {
  const membership = await ctx.db.query.organizationMember.findFirst({
    where: and(
      eq(organizationMember.organizationId, orgId),
      eq(organizationMember.userId, ctx.session.user.id),
      eq(organizationMember.role, "admin")
    ),
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin of this organization",
    });
  }

  return membership;
}

// Generate invoice number: WATTLY-2025-001
function generateInvoiceNumber(year: number, sequence: number): string {
  return `WATTLY-${year}-${sequence.toString().padStart(3, "0")}`;
}

export const platformBillingRouter = createTRPCRouter({
  // Get platform invoices for an organization (LEC admin view)
  getMyPlatformInvoices: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyOrgAdmin(ctx, input.orgId);

      const invoices = await ctx.db.query.platformInvoice.findMany({
        where: eq(platformInvoice.organizationId, input.orgId),
        orderBy: [desc(platformInvoice.createdAt)],
        limit: input.limit,
        offset: input.offset,
      });

      return {
        invoices: invoices.map((inv: typeof platformInvoice.$inferSelect) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          year: inv.year,
          month: inv.month,
          totalKwhManaged: parseFloat(inv.totalKwhManaged),
          ratePerKwh: parseFloat(inv.ratePerKwh),
          calculatedAmount: parseFloat(inv.calculatedAmount),
          minimumAmount: parseFloat(inv.minimumAmount),
          finalAmount: parseFloat(inv.finalAmount),
          vatRate: parseFloat(inv.vatRate),
          vatAmount: parseFloat(inv.vatAmount),
          totalAmount: parseFloat(inv.totalAmount),
          status: inv.status,
          pdfUrl: inv.pdfUrl,
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          sentAt: inv.sentAt,
          paidAt: inv.paidAt,
        })),
      };
    }),

  // Get a single platform invoice
  getById: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.platformInvoice.findFirst({
        where: eq(platformInvoice.id, input.invoiceId),
        with: { organization: true },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform invoice not found",
        });
      }

      await verifyOrgAdmin(ctx, invoice.organizationId);

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        year: invoice.year,
        month: invoice.month,
        totalKwhManaged: parseFloat(invoice.totalKwhManaged),
        ratePerKwh: parseFloat(invoice.ratePerKwh),
        calculatedAmount: parseFloat(invoice.calculatedAmount),
        minimumAmount: parseFloat(invoice.minimumAmount),
        finalAmount: parseFloat(invoice.finalAmount),
        vatRate: parseFloat(invoice.vatRate),
        vatAmount: parseFloat(invoice.vatAmount),
        totalAmount: parseFloat(invoice.totalAmount),
        status: invoice.status,
        pdfUrl: invoice.pdfUrl,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
        sentAt: invoice.sentAt,
        paidAt: invoice.paidAt,
        organization: {
          id: invoice.organization.id,
          name: invoice.organization.name,
          address: invoice.organization.address,
          city: invoice.organization.city,
          postalCode: invoice.organization.postalCode,
        },
      };
    }),

  // Generate a platform invoice for an organization (called monthly)
  generateInvoice: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number().min(2024).max(2100),
        month: z.number().min(1).max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrgAdmin(ctx, input.orgId);

      // Check if invoice already exists for this period
      const existingInvoice = await ctx.db.query.platformInvoice.findFirst({
        where: and(
          eq(platformInvoice.organizationId, input.orgId),
          eq(platformInvoice.year, input.year),
          eq(platformInvoice.month, input.month)
        ),
      });

      if (existingInvoice) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `An invoice already exists for ${input.month}/${input.year}`,
        });
      }

      // Get organization
      const org = await ctx.db.query.organization.findFirst({
        where: eq(organization.id, input.orgId),
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Calculate total kWh managed for the month
      // Sum all consumption from monthlyAggregation for all members
      const [aggregationResult] = await ctx.db
        .select({
          totalKwh: sum(monthlyAggregation.totalConsumptionKwh),
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, input.year),
            eq(monthlyAggregation.month, input.month)
          )
        );

      const totalKwhManaged = parseFloat(aggregationResult?.totalKwh ?? "0");

      // Calculate amounts
      const calculatedAmount = totalKwhManaged * RATE_PER_KWH;
      const finalAmount = Math.max(calculatedAmount, MINIMUM_AMOUNT);
      const vatAmount = finalAmount * (VAT_RATE / 100);
      const totalAmount = finalAmount + vatAmount;

      // Get next invoice number for the year
      const existingInvoicesThisYear = await ctx.db.query.platformInvoice.findMany({
        where: eq(platformInvoice.year, input.year),
        columns: { id: true },
      });
      const sequence = existingInvoicesThisYear.length + 1;
      const invoiceNumber = generateInvoiceNumber(input.year, sequence);

      // Set due date to 30 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create the invoice
      const invoiceId = createId();
      await ctx.db.insert(platformInvoice).values({
        id: invoiceId,
        organizationId: input.orgId,
        invoiceNumber,
        year: input.year,
        month: input.month,
        totalKwhManaged: totalKwhManaged.toFixed(2),
        ratePerKwh: RATE_PER_KWH.toFixed(4),
        calculatedAmount: calculatedAmount.toFixed(2),
        minimumAmount: MINIMUM_AMOUNT.toFixed(2),
        finalAmount: finalAmount.toFixed(2),
        vatRate: VAT_RATE.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: "draft",
        dueDate,
        createdAt: new Date(),
      });

      return {
        id: invoiceId,
        invoiceNumber,
        totalKwhManaged,
        calculatedAmount,
        finalAmount,
        vatAmount,
        totalAmount,
      };
    }),

  // Mark invoice as sent
  markAsSent: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.platformInvoice.findFirst({
        where: eq(platformInvoice.id, input.invoiceId),
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform invoice not found",
        });
      }

      await verifyOrgAdmin(ctx, invoice.organizationId);

      if (invoice.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft invoices can be marked as sent",
        });
      }

      await ctx.db
        .update(platformInvoice)
        .set({
          status: "sent",
          sentAt: new Date(),
        })
        .where(eq(platformInvoice.id, input.invoiceId));

      return { success: true };
    }),

  // Mark invoice as paid
  markAsPaid: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.platformInvoice.findFirst({
        where: eq(platformInvoice.id, input.invoiceId),
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Platform invoice not found",
        });
      }

      await verifyOrgAdmin(ctx, invoice.organizationId);

      if (invoice.status === "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice is already marked as paid",
        });
      }

      await ctx.db
        .update(platformInvoice)
        .set({
          status: "paid",
          paidAt: new Date(),
        })
        .where(eq(platformInvoice.id, input.invoiceId));

      return { success: true };
    }),

  // Get billing summary for dashboard
  getBillingSummary: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyOrgAdmin(ctx, input.orgId);

      // Get all invoices for this org
      const invoices = await ctx.db.query.platformInvoice.findMany({
        where: eq(platformInvoice.organizationId, input.orgId),
        orderBy: [desc(platformInvoice.createdAt)],
      });

      // Calculate totals
      let totalPaid = 0;
      let totalOutstanding = 0;
      let overdueCount = 0;
      const now = new Date();

      invoices.forEach((inv: typeof platformInvoice.$inferSelect) => {
        const amount = parseFloat(inv.totalAmount);
        if (inv.status === "paid") {
          totalPaid += amount;
        } else {
          totalOutstanding += amount;
          if (inv.dueDate && new Date(inv.dueDate) < now) {
            overdueCount++;
          }
        }
      });

      // Get most recent invoice
      const latestInvoice = invoices[0];

      return {
        totalPaid,
        totalOutstanding,
        overdueCount,
        invoiceCount: invoices.length,
        latestInvoice: latestInvoice
          ? {
              id: latestInvoice.id,
              invoiceNumber: latestInvoice.invoiceNumber,
              totalAmount: parseFloat(latestInvoice.totalAmount),
              status: latestInvoice.status,
              dueDate: latestInvoice.dueDate,
            }
          : null,
        ratePerKwh: RATE_PER_KWH,
        minimumMonthly: MINIMUM_AMOUNT,
        vatRate: VAT_RATE,
      };
    }),
});
