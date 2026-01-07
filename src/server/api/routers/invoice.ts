import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, count, or, sql, lt } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  organizationMember,
  invoice,
  invoiceLine,
  monthlyAggregation,
  tariffPlan,
  organization,
} from "~/server/db/schema";
import { generateInvoicePdf } from "~/lib/pdf/generate-invoice-pdf";
import type { InvoiceData } from "~/lib/pdf/invoice-template";
import { sendInvoiceEmail, sendPaymentReminderEmail } from "~/lib/email/send-email";

// Helper to verify org membership
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
async function verifyMembership(
  ctx: { db: any; session: { user: { id: string } } },
  orgId: string,
  requireAdmin = false
) {
  const membership = await ctx.db.query.organizationMember.findFirst({
    where: and(
      eq(organizationMember.organizationId, orgId),
      eq(organizationMember.userId, ctx.session.user.id)
    ),
  });

  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not a member of this organization",
    });
  }

  if (requireAdmin && membership.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only admins can perform this action",
    });
  }

  return membership;
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

export const invoiceRouter = createTRPCRouter({
  // List invoices with filtering
  list: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        status: z
          .enum(["draft", "sent", "paid", "overdue", "cancelled"])
          .optional(),
        memberId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      // Build where conditions
      const conditions = [eq(invoice.organizationId, input.orgId)];

      if (input.status) {
        conditions.push(eq(invoice.status, input.status));
      }

      if (input.memberId) {
        conditions.push(eq(invoice.memberId, input.memberId));
      }

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: count() })
        .from(invoice)
        .where(and(...conditions));

      // Get invoices with member info
      const invoices = await ctx.db.query.invoice.findMany({
        where: and(...conditions),
        orderBy: [desc(invoice.createdAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          member: true,
        },
      });

      // Filter by search if provided
      let filteredInvoices = invoices;
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredInvoices = invoices.filter(
          (inv) =>
            inv.invoiceNumber.toLowerCase().includes(searchLower) ||
            inv.member.firstname.toLowerCase().includes(searchLower) ||
            inv.member.lastname.toLowerCase().includes(searchLower) ||
            inv.member.email.toLowerCase().includes(searchLower)
        );
      }

      return {
        invoices: filteredInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          memberName: `${inv.member.firstname} ${inv.member.lastname}`,
          memberEmail: inv.member.email,
          memberId: inv.memberId,
          periodStart: inv.periodStart,
          periodEnd: inv.periodEnd,
          status: inv.status,
          totalChf: parseFloat(inv.totalChf),
          dueDate: inv.dueDate,
          createdAt: inv.createdAt,
          sentAt: inv.sentAt,
          paidAt: inv.paidAt,
          paymentMethod: inv.paymentMethod,
          paymentReference: inv.paymentReference,
          paymentNotes: inv.paymentNotes,
        })),
        total: countResult?.count ?? 0,
        hasMore: input.offset + invoices.length < (countResult?.count ?? 0),
      };
    }),

  // Get invoice with line items
  getById: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const inv = await ctx.db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
        with: {
          member: true,
          lines: {
            orderBy: [invoiceLine.sortOrder],
          },
          organization: true,
        },
      });

      if (!inv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await verifyMembership(ctx, inv.organizationId);

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        organization: {
          name: inv.organization.name,
          address: inv.organization.address,
          postalCode: inv.organization.postalCode,
          city: inv.organization.city,
          contactEmail: inv.organization.contactEmail,
        },
        member: {
          id: inv.member.id,
          name: `${inv.member.firstname} ${inv.member.lastname}`,
          email: inv.member.email,
          address: inv.member.address,
          postalCode: inv.member.postalCode,
          city: inv.member.city,
          podNumber: inv.member.podNumber,
        },
        periodStart: inv.periodStart,
        periodEnd: inv.periodEnd,
        status: inv.status,
        dueDate: inv.dueDate,
        subtotalChf: parseFloat(inv.subtotalChf),
        vatAmountChf: parseFloat(inv.vatAmountChf),
        totalChf: parseFloat(inv.totalChf),
        lines: inv.lines.map((line) => ({
          id: line.id,
          description: line.description,
          quantity: parseFloat(line.quantity),
          unit: line.unit,
          unitPriceChf: parseFloat(line.unitPriceChf),
          totalChf: parseFloat(line.totalChf),
          lineType: line.lineType,
        })),
        sentAt: inv.sentAt,
        paidAt: inv.paidAt,
        createdAt: inv.createdAt,
      };
    }),

  // Generate invoices for a period
  generate: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
        month: z.number().min(1).max(12),
        memberIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      // Get organization for billing settings
      const org = await ctx.db.query.organization.findFirst({
        where: eq(organization.id, input.orgId),
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Get default tariff
      const defaultTariff = await ctx.db.query.tariffPlan.findFirst({
        where: and(
          eq(tariffPlan.organizationId, input.orgId),
          eq(tariffPlan.isDefault, true)
        ),
      });

      if (!defaultTariff) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No default tariff plan configured",
        });
      }

      // Get monthly aggregations for the period
      const aggregations = await ctx.db.query.monthlyAggregation.findMany({
        where: and(
          eq(monthlyAggregation.organizationId, input.orgId),
          eq(monthlyAggregation.year, input.year),
          eq(monthlyAggregation.month, input.month),
          input.memberIds
            ? sql`${monthlyAggregation.memberId} IN (${sql.join(
                input.memberIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql`1=1`
        ),
        with: {
          member: true,
        },
      });

      if (aggregations.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No energy data found for this period",
        });
      }

      // Get next invoice number
      const [lastInvoice] = await ctx.db
        .select({ invoiceNumber: invoice.invoiceNumber })
        .from(invoice)
        .where(eq(invoice.organizationId, input.orgId))
        .orderBy(desc(invoice.createdAt))
        .limit(1);

      let nextNumber = 1;
      if (lastInvoice?.invoiceNumber) {
        const match = /(\d+)$/.exec(lastInvoice.invoiceNumber);
        if (match?.[1]) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const periodStart = new Date(input.year, input.month - 1, 1);
      const periodEnd = new Date(input.year, input.month, 0);
      const paymentTermDays = org.billingSettings?.paymentTermDays ?? 30;
      const vatRate = parseFloat(defaultTariff.vatRate);
      const communityRate = parseFloat(defaultTariff.communityRateChfKwh);
      const gridRate = parseFloat(defaultTariff.gridRateChfKwh);
      const injectionRate = parseFloat(defaultTariff.injectionRateChfKwh);
      const monthlyFee = parseFloat(defaultTariff.monthlyFeeChf ?? "0");

      const createdInvoices: string[] = [];

      for (const agg of aggregations) {
        // Skip admin members
        if (agg.member.podNumber === "ADMIN-POD") continue;

        // Check if invoice already exists for this member and period
        const existingInvoice = await ctx.db.query.invoice.findFirst({
          where: and(
            eq(invoice.organizationId, input.orgId),
            eq(invoice.memberId, agg.memberId),
            sql`EXTRACT(YEAR FROM ${invoice.periodStart}) = ${input.year}`,
            sql`EXTRACT(MONTH FROM ${invoice.periodStart}) = ${input.month}`
          ),
        });

        if (existingInvoice) continue;

        const invoiceId = createId();
        const invoiceNumber = `${input.year}-${String(input.month).padStart(2, "0")}-${String(nextNumber).padStart(4, "0")}`;
        nextNumber++;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + paymentTermDays);

        // Calculate line items
        const lines: Array<{
          description: string;
          quantity: number;
          unit: string;
          unitPrice: number;
          total: number;
          lineType: "consumption" | "production_credit" | "fee" | "adjustment";
          sortOrder: number;
        }> = [];

        const communityConsumption = parseFloat(agg.communityConsumptionKwh);
        const gridConsumption = parseFloat(agg.gridConsumptionKwh);
        const exportedToCommunity = parseFloat(agg.exportedToCommunityKwh);

        // Community consumption
        if (communityConsumption > 0) {
          lines.push({
            description: "Consommation communautaire",
            quantity: communityConsumption,
            unit: "kWh",
            unitPrice: communityRate,
            total: communityConsumption * communityRate,
            lineType: "consumption",
            sortOrder: 1,
          });
        }

        // Grid consumption
        if (gridConsumption > 0) {
          lines.push({
            description: "Consommation réseau",
            quantity: gridConsumption,
            unit: "kWh",
            unitPrice: gridRate,
            total: gridConsumption * gridRate,
            lineType: "consumption",
            sortOrder: 2,
          });
        }

        // Production credit (if producer/prosumer)
        if (exportedToCommunity > 0) {
          lines.push({
            description: "Crédit injection communauté",
            quantity: exportedToCommunity,
            unit: "kWh",
            unitPrice: -injectionRate,
            total: -(exportedToCommunity * injectionRate),
            lineType: "production_credit",
            sortOrder: 3,
          });
        }

        // Monthly fee
        if (monthlyFee > 0) {
          lines.push({
            description: "Frais mensuels",
            quantity: 1,
            unit: "forfait",
            unitPrice: monthlyFee,
            total: monthlyFee,
            lineType: "fee",
            sortOrder: 4,
          });
        }

        const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
        const vatAmount = subtotal * (vatRate / 100);
        const total = subtotal + vatAmount;

        // Create invoice
        await ctx.db.insert(invoice).values({
          id: invoiceId,
          invoiceNumber,
          organizationId: input.orgId,
          memberId: agg.memberId,
          periodStart,
          periodEnd,
          status: "draft",
          dueDate,
          subtotalChf: subtotal.toFixed(2),
          vatAmountChf: vatAmount.toFixed(2),
          totalChf: total.toFixed(2),
        });

        // Create invoice lines
        for (const line of lines) {
          await ctx.db.insert(invoiceLine).values({
            id: createId(),
            invoiceId,
            description: line.description,
            quantity: line.quantity.toFixed(4),
            unit: line.unit,
            unitPriceChf: line.unitPrice.toFixed(4),
            totalChf: line.total.toFixed(2),
            lineType: line.lineType,
            sortOrder: line.sortOrder,
          });
        }

        createdInvoices.push(invoiceId);
      }

      return {
        created: createdInvoices.length,
        invoiceIds: createdInvoices,
      };
    }),

  // Update invoice status
  updateStatus: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
      });

      if (!inv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await verifyMembership(ctx, inv.organizationId, true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updates: Record<string, any> = {
        status: input.status,
        updatedAt: new Date(),
      };

      if (input.status === "sent" && !inv.sentAt) {
        updates.sentAt = new Date();
      }

      if (input.status === "paid" && !inv.paidAt) {
        updates.paidAt = new Date();
      }

      await ctx.db
        .update(invoice)
        .set(updates)
        .where(eq(invoice.id, input.invoiceId));

      return { success: true };
    }),

  // Mark invoice as paid with payment details
  markAsPaid: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        paidAt: z.date().optional(),
        paymentMethod: z.enum(["bank_transfer", "cash", "other"]).optional(),
        paymentReference: z.string().optional(),
        paymentNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
      });

      if (!inv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await verifyMembership(ctx, inv.organizationId, true);

      await ctx.db
        .update(invoice)
        .set({
          status: "paid",
          paidAt: input.paidAt ?? new Date(),
          paymentMethod: input.paymentMethod,
          paymentReference: input.paymentReference,
          paymentNotes: input.paymentNotes,
          updatedAt: new Date(),
        })
        .where(eq(invoice.id, input.invoiceId));

      return { success: true };
    }),

  // Get payment history for an organization
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const conditions = [
        eq(invoice.organizationId, input.orgId),
        eq(invoice.status, "paid"),
      ];

      if (input.year) {
        conditions.push(sql`EXTRACT(YEAR FROM ${invoice.paidAt}) = ${input.year}`);
      }

      if (input.month) {
        conditions.push(sql`EXTRACT(MONTH FROM ${invoice.paidAt}) = ${input.month}`);
      }

      // Get total count
      const [countResult] = await ctx.db
        .select({ count: count() })
        .from(invoice)
        .where(and(...conditions));

      // Get paid invoices with member info
      const paidInvoices = await ctx.db.query.invoice.findMany({
        where: and(...conditions),
        orderBy: [desc(invoice.paidAt)],
        limit: input.limit,
        offset: input.offset,
        with: {
          member: true,
        },
      });

      // Calculate totals
      const [totals] = await ctx.db
        .select({
          totalAmount: sql<string>`SUM(${invoice.totalChf})`,
          invoiceCount: count(),
        })
        .from(invoice)
        .where(and(...conditions));

      return {
        payments: paidInvoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          memberName: `${inv.member.firstname} ${inv.member.lastname}`,
          memberEmail: inv.member.email,
          totalChf: parseFloat(inv.totalChf),
          paidAt: inv.paidAt,
          paymentMethod: inv.paymentMethod,
          paymentReference: inv.paymentReference,
          paymentNotes: inv.paymentNotes,
          periodStart: inv.periodStart,
          periodEnd: inv.periodEnd,
        })),
        totalCount: countResult?.count ?? 0,
        totalAmount: parseFloat(totals?.totalAmount ?? "0"),
        hasMore: input.offset + paidInvoices.length < (countResult?.count ?? 0),
      };
    }),

  // Send batch of invoices by email
  sendBatch: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        invoiceIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      const results: { sent: number; errors: Array<{ invoiceId: string; error: string }> } = {
        sent: 0,
        errors: [],
      };

      for (const invoiceId of input.invoiceIds) {
        try {
          const inv = await ctx.db.query.invoice.findFirst({
            where: and(
              eq(invoice.id, invoiceId),
              eq(invoice.organizationId, input.orgId)
            ),
            with: {
              organization: true,
              member: true,
            },
          });

          if (!inv) {
            results.errors.push({ invoiceId, error: "Invoice not found" });
            continue;
          }

          if (inv.status !== "draft") {
            results.errors.push({ invoiceId, error: "Invoice is not a draft" });
            continue;
          }

          // Format dates
          const formatDate = (date: Date) => new Date(date).toLocaleDateString("fr-CH");

          // Send the email
          const emailResult = await sendInvoiceEmail({
            to: inv.member.email,
            organizationName: inv.organization.name,
            memberName: `${inv.member.firstname} ${inv.member.lastname}`,
            invoiceNumber: inv.invoiceNumber,
            totalChf: parseFloat(inv.totalChf),
            dueDate: formatDate(inv.dueDate),
            periodStart: formatDate(inv.periodStart),
            periodEnd: formatDate(inv.periodEnd),
            pdfUrl: inv.pdfUrl ?? undefined,
            locale: "fr",
          });

          if (!emailResult.success) {
            results.errors.push({ invoiceId, error: emailResult.error ?? "Failed to send email" });
            continue;
          }

          // Update invoice status
          await ctx.db
            .update(invoice)
            .set({
              status: "sent",
              sentAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(invoice.id, invoiceId));

          results.sent++;
        } catch (error) {
          results.errors.push({
            invoiceId,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      return results;
    }),

  // Mark batch of invoices as paid
  markPaidBatch: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        invoiceIds: z.array(z.string()),
        paidAt: z.date().optional(),
        paymentMethod: z.enum(["bank_transfer", "cash", "other"]).optional(),
        paymentNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      const paidAt = input.paidAt ?? new Date();

      // Update all invoices at once
      const result = await ctx.db
        .update(invoice)
        .set({
          status: "paid",
          paidAt,
          paymentMethod: input.paymentMethod,
          paymentNotes: input.paymentNotes,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(invoice.organizationId, input.orgId),
            sql`${invoice.id} IN (${sql.join(
              input.invoiceIds.map((id) => sql`${id}`),
              sql`, `
            )})`,
            or(
              eq(invoice.status, "sent"),
              eq(invoice.status, "overdue")
            )
          )
        )
        .returning({ id: invoice.id });

      return {
        marked: result.length,
      };
    }),

  // Delete invoice (only drafts)
  delete: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
      });

      if (!inv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await verifyMembership(ctx, inv.organizationId, true);

      if (inv.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only draft invoices can be deleted",
        });
      }

      // Delete lines first (cascade should handle this, but being explicit)
      await ctx.db.delete(invoiceLine).where(eq(invoiceLine.invoiceId, input.invoiceId));
      await ctx.db.delete(invoice).where(eq(invoice.id, input.invoiceId));

      return { success: true };
    }),

  // Get invoice stats
  getStats: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const stats = await ctx.db
        .select({
          status: invoice.status,
          count: count(),
          total: sql<string>`SUM(${invoice.totalChf})`,
        })
        .from(invoice)
        .where(eq(invoice.organizationId, input.orgId))
        .groupBy(invoice.status);

      const result: Record<string, { count: number; total: number }> = {
        draft: { count: 0, total: 0 },
        sent: { count: 0, total: 0 },
        paid: { count: 0, total: 0 },
        overdue: { count: 0, total: 0 },
        cancelled: { count: 0, total: 0 },
      };

      for (const row of stats) {
        result[row.status] = {
          count: row.count,
          total: parseFloat(row.total ?? "0"),
        };
      }

      return result;
    }),

  // Generate PDF for invoice
  generatePdf: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
        with: {
          organization: true,
          member: true,
          lines: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            orderBy: (lines: any, { asc }: any) => [asc(lines.sortOrder)],
          },
        },
      });

      if (!inv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await verifyMembership(ctx, inv.organizationId);

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
        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
        lines: inv.lines.map((line: any) => ({
          id: line.id as string,
          description: line.description as string,
          quantity: parseFloat(String(line.quantity)),
          unit: line.unit as string,
          unitPriceChf: parseFloat(String(line.unitPriceChf)),
          totalChf: parseFloat(String(line.totalChf)),
          lineType: line.lineType as string,
        })),
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
      };

      // Generate PDF and upload to blob
      // QR-bill is automatically included if IBAN is configured
      const result = await generateInvoicePdf({
        invoice: invoiceData,
        uploadToBlob: true,
      });

      // Update invoice with PDF URL if upload succeeded
      if (result.url) {
        await ctx.db
          .update(invoice)
          .set({ pdfUrl: result.url, updatedAt: new Date() })
          .where(eq(invoice.id, input.invoiceId));
      }

      return {
        success: true,
        pdfUrl: result.url,
      };
    }),

  // Get overdue count for dashboard
  getOverdueCount: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [result] = await ctx.db
        .select({ count: count() })
        .from(invoice)
        .where(
          and(
            eq(invoice.organizationId, input.orgId),
            eq(invoice.status, "sent"),
            lt(invoice.dueDate, today)
          )
        );

      return {
        overdueCount: result?.count ?? 0,
      };
    }),

  // Mark overdue invoices (for cron job)
  markOverdue: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const result = await ctx.db
        .update(invoice)
        .set({ status: "overdue", updatedAt: new Date() })
        .where(
          and(
            eq(invoice.organizationId, input.orgId),
            eq(invoice.status, "sent"),
            lt(invoice.dueDate, today)
          )
        )
        .returning({ id: invoice.id });

      return {
        markedOverdue: result.length,
      };
    }),

  // Send invoice email to member
  sendInvoiceEmail: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
        with: {
          organization: true,
          member: true,
        },
      });

      if (!inv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await verifyMembership(ctx, inv.organizationId, true);

      // Format dates
      const formatDate = (date: Date) => new Date(date).toLocaleDateString("fr-CH");

      // Send the email
      const result = await sendInvoiceEmail({
        to: inv.member.email,
        organizationName: inv.organization.name,
        memberName: `${inv.member.firstname} ${inv.member.lastname}`,
        invoiceNumber: inv.invoiceNumber,
        totalChf: parseFloat(inv.totalChf),
        dueDate: formatDate(inv.dueDate),
        periodStart: formatDate(inv.periodStart),
        periodEnd: formatDate(inv.periodEnd),
        pdfUrl: inv.pdfUrl ?? undefined,
        locale: "fr",
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send email: ${result.error}`,
        });
      }

      // Update invoice status to sent if it was draft
      if (inv.status === "draft") {
        await ctx.db
          .update(invoice)
          .set({
            status: "sent",
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(invoice.id, input.invoiceId));
      }

      return { success: true, emailId: result.id };
    }),

  // Send payment reminder email
  sendReminderEmail: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const inv = await ctx.db.query.invoice.findFirst({
        where: eq(invoice.id, input.invoiceId),
        with: {
          organization: true,
          member: true,
        },
      });

      if (!inv) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      await verifyMembership(ctx, inv.organizationId, true);

      // Calculate days overdue
      const today = new Date();
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysOverdue <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invoice is not overdue",
        });
      }

      // Format date
      const formatDate = (date: Date) => new Date(date).toLocaleDateString("fr-CH");

      // Send the reminder email
      const result = await sendPaymentReminderEmail({
        to: inv.member.email,
        organizationName: inv.organization.name,
        memberName: `${inv.member.firstname} ${inv.member.lastname}`,
        invoiceNumber: inv.invoiceNumber,
        totalChf: parseFloat(inv.totalChf),
        dueDate: formatDate(inv.dueDate),
        daysOverdue,
        pdfUrl: inv.pdfUrl ?? undefined,
        locale: "fr",
      });

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to send reminder: ${result.error}`,
        });
      }

      return { success: true, emailId: result.id };
    }),
});
