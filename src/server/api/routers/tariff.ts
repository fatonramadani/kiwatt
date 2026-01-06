import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, count } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { tariffPlan, organizationMember, invoice } from "~/server/db/schema";

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

export const tariffRouter = createTRPCRouter({
  // List all tariff plans for an organization
  list: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const tariffs = await ctx.db.query.tariffPlan.findMany({
        where: eq(tariffPlan.organizationId, input.orgId),
        orderBy: [desc(tariffPlan.isDefault), desc(tariffPlan.createdAt)],
      });

      return tariffs;
    }),

  // Get single tariff by ID
  getById: protectedProcedure
    .input(z.object({ tariffId: z.string() }))
    .query(async ({ ctx, input }) => {
      const tariff = await ctx.db.query.tariffPlan.findFirst({
        where: eq(tariffPlan.id, input.tariffId),
      });

      if (!tariff) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tariff plan not found",
        });
      }

      await verifyMembership(ctx, tariff.organizationId);

      return tariff;
    }),

  // Get default tariff for an organization
  getDefault: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const defaultTariff = await ctx.db.query.tariffPlan.findFirst({
        where: and(
          eq(tariffPlan.organizationId, input.orgId),
          eq(tariffPlan.isDefault, true)
        ),
      });

      return defaultTariff;
    }),

  // Create a new tariff plan
  create: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string().min(1),
        communityRateChfKwh: z.number().positive(),
        gridRateChfKwh: z.number().positive(),
        injectionRateChfKwh: z.number().positive(),
        monthlyFeeChf: z.number().min(0).default(0),
        vatRate: z.number().min(0).max(100).default(7.7),
        validFrom: z.date(),
        validTo: z.date().optional(),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      const tariffId = createId();

      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await ctx.db
          .update(tariffPlan)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(tariffPlan.organizationId, input.orgId),
              eq(tariffPlan.isDefault, true)
            )
          );
      }

      const { orgId, ...tariffData } = input;

      await ctx.db.insert(tariffPlan).values({
        id: tariffId,
        organizationId: orgId,
        name: tariffData.name,
        communityRateChfKwh: tariffData.communityRateChfKwh.toString(),
        gridRateChfKwh: tariffData.gridRateChfKwh.toString(),
        injectionRateChfKwh: tariffData.injectionRateChfKwh.toString(),
        monthlyFeeChf: tariffData.monthlyFeeChf.toString(),
        vatRate: tariffData.vatRate.toString(),
        validFrom: tariffData.validFrom,
        validTo: tariffData.validTo,
        isDefault: tariffData.isDefault,
      });

      return { id: tariffId };
    }),

  // Update a tariff plan
  update: protectedProcedure
    .input(
      z.object({
        tariffId: z.string(),
        name: z.string().min(1).optional(),
        communityRateChfKwh: z.number().positive().optional(),
        gridRateChfKwh: z.number().positive().optional(),
        injectionRateChfKwh: z.number().positive().optional(),
        monthlyFeeChf: z.number().min(0).optional(),
        vatRate: z.number().min(0).max(100).optional(),
        validFrom: z.date().optional(),
        validTo: z.date().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tariff = await ctx.db.query.tariffPlan.findFirst({
        where: eq(tariffPlan.id, input.tariffId),
      });

      if (!tariff) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tariff plan not found",
        });
      }

      await verifyMembership(ctx, tariff.organizationId, true);

      const { tariffId, ...updates } = input;

      // Convert numbers to strings for decimal fields
      const dbUpdates: Record<string, any> = { updatedAt: new Date() };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.communityRateChfKwh !== undefined)
        dbUpdates.communityRateChfKwh = updates.communityRateChfKwh.toString();
      if (updates.gridRateChfKwh !== undefined)
        dbUpdates.gridRateChfKwh = updates.gridRateChfKwh.toString();
      if (updates.injectionRateChfKwh !== undefined)
        dbUpdates.injectionRateChfKwh = updates.injectionRateChfKwh.toString();
      if (updates.monthlyFeeChf !== undefined)
        dbUpdates.monthlyFeeChf = updates.monthlyFeeChf.toString();
      if (updates.vatRate !== undefined)
        dbUpdates.vatRate = updates.vatRate.toString();
      if (updates.validFrom !== undefined) dbUpdates.validFrom = updates.validFrom;
      if (updates.validTo !== undefined) dbUpdates.validTo = updates.validTo;

      await ctx.db
        .update(tariffPlan)
        .set(dbUpdates)
        .where(eq(tariffPlan.id, tariffId));

      return { success: true };
    }),

  // Set a tariff as default
  setDefault: protectedProcedure
    .input(z.object({ tariffId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tariff = await ctx.db.query.tariffPlan.findFirst({
        where: eq(tariffPlan.id, input.tariffId),
      });

      if (!tariff) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tariff plan not found",
        });
      }

      await verifyMembership(ctx, tariff.organizationId, true);

      // Unset current default
      await ctx.db
        .update(tariffPlan)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(tariffPlan.organizationId, tariff.organizationId),
            eq(tariffPlan.isDefault, true)
          )
        );

      // Set new default
      await ctx.db
        .update(tariffPlan)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(eq(tariffPlan.id, input.tariffId));

      return { success: true };
    }),

  // Delete a tariff plan (only if not used in any invoice)
  delete: protectedProcedure
    .input(z.object({ tariffId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const tariff = await ctx.db.query.tariffPlan.findFirst({
        where: eq(tariffPlan.id, input.tariffId),
      });

      if (!tariff) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tariff plan not found",
        });
      }

      await verifyMembership(ctx, tariff.organizationId, true);

      // Check if this is the only tariff
      const [tariffCount] = await ctx.db
        .select({ count: count() })
        .from(tariffPlan)
        .where(eq(tariffPlan.organizationId, tariff.organizationId));

      if ((tariffCount?.count ?? 0) <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete the only tariff plan",
        });
      }

      // If deleting the default, we need to set another one as default
      if (tariff.isDefault) {
        const anotherTariff = await ctx.db.query.tariffPlan.findFirst({
          where: and(
            eq(tariffPlan.organizationId, tariff.organizationId),
            eq(tariffPlan.isDefault, false)
          ),
        });

        if (anotherTariff) {
          await ctx.db
            .update(tariffPlan)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(eq(tariffPlan.id, anotherTariff.id));
        }
      }

      await ctx.db.delete(tariffPlan).where(eq(tariffPlan.id, input.tariffId));

      return { success: true };
    }),
});
