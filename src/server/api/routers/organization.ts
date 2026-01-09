import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql, count, sum, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import {
  organization,
  organizationMember,
  invoice,
  monthlyAggregation,
  tariffPlan,
  loadCurve,
} from "~/server/db/schema";

export const organizationRouter = createTRPCRouter({
  // List all organizations where the current user is a member
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.organizationMember.findMany({
      where: eq(organizationMember.userId, ctx.session.user.id),
      with: {
        organization: true,
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }));
  }),

  // Get organization by slug (with access check)
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.query.organization.findFirst({
        where: eq(organization.slug, input.slug),
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      // Check if user is a member
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, org.id),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      return {
        ...org,
        role: membership.role,
      };
    }),

  // Create a new organization (CEL)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        slug: z
          .string()
          .min(2)
          .max(50)
          .regex(/^[a-z0-9-]+$/, {
            message: "Slug must contain only lowercase letters, numbers, and hyphens",
          }),
        commune: z.string().optional(),
        canton: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        timbreReduction: z.enum(["20", "40"]).default("20"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if slug is already taken
      const existing = await ctx.db.query.organization.findFirst({
        where: eq(organization.slug, input.slug),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This URL identifier is already taken",
        });
      }

      const orgId = createId();

      // Create organization
      await ctx.db.insert(organization).values({
        id: orgId,
        name: input.name,
        slug: input.slug,
        address: input.address,
        postalCode: input.postalCode,
        city: input.city,
        commune: input.commune,
        canton: input.canton,
        timbreReduction: input.timbreReduction,
        billingSettings: {
          currency: "CHF",
          vatRate: 7.7,
          paymentTermDays: 30,
        },
      });

      // Add creator as admin member
      await ctx.db.insert(organizationMember).values({
        id: createId(),
        organizationId: orgId,
        userId: ctx.session.user.id,
        role: "admin",
        firstname: ctx.session.user.name?.split(" ")[0] ?? "",
        lastname: ctx.session.user.name?.split(" ").slice(1).join(" ") ?? "",
        email: ctx.session.user.email,
        podNumber: "ADMIN-POD",
        status: "active",
      });

      return { id: orgId, slug: input.slug };
    }),

  // Get dashboard stats for an organization
  getDashboardStats: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify membership
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Get member count (excluding admin accounts with ADMIN-POD)
      const [memberCount] = await ctx.db
        .select({ count: count() })
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.orgId),
            sql`${organizationMember.podNumber} != 'ADMIN-POD'`
          )
        );

      // Get pending invoices count
      const [pendingInvoices] = await ctx.db
        .select({ count: count() })
        .from(invoice)
        .where(
          and(
            eq(invoice.organizationId, input.orgId),
            eq(invoice.status, "sent")
          )
        );

      // Get total invoices count (to check if any invoices exist)
      const [totalInvoices] = await ctx.db
        .select({ count: count() })
        .from(invoice)
        .where(eq(invoice.organizationId, input.orgId));

      // Get current month/year
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      // Get monthly energy totals
      const [energyStats] = await ctx.db
        .select({
          totalConsumption: sum(monthlyAggregation.totalConsumptionKwh),
          totalProduction: sum(monthlyAggregation.totalProductionKwh),
          communityConsumption: sum(monthlyAggregation.communityConsumptionKwh),
          gridConsumption: sum(monthlyAggregation.gridConsumptionKwh),
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, currentYear),
            eq(monthlyAggregation.month, currentMonth)
          )
        );

      // Check if any load curves have been imported
      const [loadCurveCount] = await ctx.db
        .select({ count: count() })
        .from(loadCurve)
        .where(eq(loadCurve.organizationId, input.orgId));

      // Get default tariff for this organization (if configured)
      const defaultTariff = await ctx.db.query.tariffPlan.findFirst({
        where: and(
          eq(tariffPlan.organizationId, input.orgId),
          eq(tariffPlan.isDefault, true)
        ),
      });

      // Parse energy values
      const communityKwh = parseFloat(energyStats?.communityConsumption ?? "0");
      const totalConsumption = parseFloat(energyStats?.totalConsumption ?? "0");
      const totalProduction = parseFloat(energyStats?.totalProduction ?? "0");
      const gridConsumption = parseFloat(energyStats?.gridConsumption ?? "0");

      // Only calculate savings if tariff is configured
      let estimatedSavings: number | null = null;
      if (defaultTariff && communityKwh > 0) {
        const gridRate = parseFloat(defaultTariff.gridRateChfKwh);
        const communityRate = parseFloat(defaultTariff.communityRateChfKwh);
        estimatedSavings = communityKwh * (gridRate - communityRate);
      }

      // Determine setup status
      const hasMembers = (memberCount?.count ?? 0) > 0;
      const hasTariff = !!defaultTariff;
      const hasEnergyData = (loadCurveCount?.count ?? 0) > 0;
      const hasInvoices = (totalInvoices?.count ?? 0) > 0;

      return {
        // Member and invoice counts
        totalMembers: memberCount?.count ?? 0,
        pendingInvoices: pendingInvoices?.count ?? 0,

        // Energy data (null if no data imported)
        hasEnergyData,
        totalProduction: hasEnergyData ? totalProduction : null,
        totalConsumption: hasEnergyData ? totalConsumption : null,
        communityConsumption: hasEnergyData ? communityKwh : null,
        gridConsumption: hasEnergyData ? gridConsumption : null,

        // Savings (null if no tariff configured)
        hasTariff,
        estimatedSavings,

        // Period info
        currentMonth,
        currentYear,

        // Setup status for onboarding
        setupStatus: {
          hasMembers,
          hasTariff,
          hasEnergyData,
          hasInvoices,
        },
      };
    }),

  // Get recent activity for dashboard
  getRecentActivity: protectedProcedure
    .input(z.object({ orgId: z.string(), limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      // Verify membership
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id)
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }

      // Get recent invoices
      const recentInvoices = await ctx.db.query.invoice.findMany({
        where: eq(invoice.organizationId, input.orgId),
        orderBy: [desc(invoice.createdAt)],
        limit: input.limit,
        with: {
          member: true,
        },
      });

      // Get recently added members
      const recentMembers = await ctx.db.query.organizationMember.findMany({
        where: eq(organizationMember.organizationId, input.orgId),
        orderBy: [desc(organizationMember.createdAt)],
        limit: input.limit,
      });

      return {
        recentInvoices: recentInvoices.map((inv) => ({
          id: inv.id,
          type: "invoice" as const,
          description: `Invoice ${inv.invoiceNumber} for ${inv.member.firstname} ${inv.member.lastname}`,
          status: inv.status,
          amount: parseFloat(inv.totalChf),
          date: inv.createdAt,
        })),
        recentMembers: recentMembers.map((m) => ({
          id: m.id,
          type: "member" as const,
          description: `${m.firstname} ${m.lastname} joined`,
          status: m.status,
          date: m.createdAt,
        })),
      };
    }),

  // Update organization settings
  update: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string().min(2).max(100).optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        commune: z.string().optional(),
        canton: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
        distributionStrategy: z.enum(["prorata", "equal", "priority"]).optional(),
        timbreReduction: z.enum(["20", "40"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify admin membership
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id),
          eq(organizationMember.role, "admin")
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update organization settings",
        });
      }

      const { orgId, ...updates } = input;

      await ctx.db
        .update(organization)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(organization.id, orgId));

      return { success: true };
    }),

  // Update billing settings
  updateBillingSettings: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        vatRate: z.number().min(0).max(100).optional(),
        paymentTermDays: z.number().min(1).max(365).optional(),
        vatNumber: z.string().optional(),
        uid: z.string().optional(),
        iban: z.string().optional(),
        qrIban: z.string().optional(),
        payeeName: z.string().optional(),
        payeeAddress: z.string().optional(),
        payeeZip: z.string().optional(),
        payeeCity: z.string().optional(),
        payeeCountry: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify admin membership
      const membership = await ctx.db.query.organizationMember.findFirst({
        where: and(
          eq(organizationMember.organizationId, input.orgId),
          eq(organizationMember.userId, ctx.session.user.id),
          eq(organizationMember.role, "admin")
        ),
      });

      if (!membership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update billing settings",
        });
      }

      // Get current org to merge billing settings
      const org = await ctx.db.query.organization.findFirst({
        where: eq(organization.id, input.orgId),
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const currentSettings = org.billingSettings ?? {
        currency: "CHF",
        vatRate: 8.1,
        paymentTermDays: 30,
      };

      const { orgId, ...updates } = input;

      const newSettings = {
        ...currentSettings,
        ...updates,
      };

      await ctx.db
        .update(organization)
        .set({
          billingSettings: newSettings,
          updatedAt: new Date(),
        })
        .where(eq(organization.id, orgId));

      return { success: true };
    }),
});
