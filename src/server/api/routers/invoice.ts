import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, count, or, ilike, sql, max } from "drizzle-orm";
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

// Helper to verify org membership
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
        const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
        if (match) {
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
});
