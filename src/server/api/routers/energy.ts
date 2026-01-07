import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sum, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  organizationMember,
  loadCurve,
  monthlyAggregation,
} from "~/server/db/schema";

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

export const energyRouter = createTRPCRouter({
  // Get community energy overview for a period
  getOverview: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const [stats] = await ctx.db
        .select({
          totalConsumption: sum(monthlyAggregation.totalConsumptionKwh),
          totalProduction: sum(monthlyAggregation.totalProductionKwh),
          selfConsumption: sum(monthlyAggregation.selfConsumptionKwh),
          communityConsumption: sum(monthlyAggregation.communityConsumptionKwh),
          gridConsumption: sum(monthlyAggregation.gridConsumptionKwh),
          exportedToCommunity: sum(monthlyAggregation.exportedToCommunityKwh),
          exportedToGrid: sum(monthlyAggregation.exportedToGridKwh),
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, input.year),
            eq(monthlyAggregation.month, input.month)
          )
        );

      return {
        year: input.year,
        month: input.month,
        totalConsumptionKwh: parseFloat(stats?.totalConsumption ?? "0"),
        totalProductionKwh: parseFloat(stats?.totalProduction ?? "0"),
        selfConsumptionKwh: parseFloat(stats?.selfConsumption ?? "0"),
        communityConsumptionKwh: parseFloat(stats?.communityConsumption ?? "0"),
        gridConsumptionKwh: parseFloat(stats?.gridConsumption ?? "0"),
        exportedToCommunityKwh: parseFloat(stats?.exportedToCommunity ?? "0"),
        exportedToGridKwh: parseFloat(stats?.exportedToGrid ?? "0"),
      };
    }),

  // Get monthly aggregations for all members
  getMonthlyAggregations: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const aggregations = await ctx.db.query.monthlyAggregation.findMany({
        where: and(
          eq(monthlyAggregation.organizationId, input.orgId),
          eq(monthlyAggregation.year, input.year),
          eq(monthlyAggregation.month, input.month)
        ),
        with: {
          member: true,
        },
      });

      return aggregations.map((agg) => ({
        id: agg.id,
        memberId: agg.memberId,
        memberName: `${agg.member.firstname} ${agg.member.lastname}`,
        podNumber: agg.member.podNumber,
        installationType: agg.member.installationType,
        totalConsumptionKwh: parseFloat(agg.totalConsumptionKwh),
        totalProductionKwh: parseFloat(agg.totalProductionKwh),
        selfConsumptionKwh: parseFloat(agg.selfConsumptionKwh),
        communityConsumptionKwh: parseFloat(agg.communityConsumptionKwh),
        gridConsumptionKwh: parseFloat(agg.gridConsumptionKwh),
        exportedToCommunityKwh: parseFloat(agg.exportedToCommunityKwh),
        exportedToGridKwh: parseFloat(agg.exportedToGridKwh),
      }));
    }),

  // Get available periods (months with data)
  getAvailablePeriods: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const periods = await ctx.db
        .selectDistinct({
          year: monthlyAggregation.year,
          month: monthlyAggregation.month,
        })
        .from(monthlyAggregation)
        .where(eq(monthlyAggregation.organizationId, input.orgId))
        .orderBy(desc(monthlyAggregation.year), desc(monthlyAggregation.month));

      return periods;
    }),

  // Import load curve data from CSV
  importLoadCurve: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        data: z.array(
          z.object({
            podNumber: z.string(),
            timestamp: z.string(),
            consumptionKwh: z.number(),
            productionKwh: z.number(),
          })
        ),
        sourceFile: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      // Get all members for this organization to map POD numbers
      const members = await ctx.db.query.organizationMember.findMany({
        where: eq(organizationMember.organizationId, input.orgId),
      });
      const podToMember = new Map(members.map((m) => [m.podNumber, m]));

      // Group data by POD number and month
      const dataByPodAndMonth = new Map<
        string,
        {
          memberId: string;
          year: number;
          month: number;
          dataPoints: Array<{
            timestamp: string;
            consumptionKwh: number;
            productionKwh: number;
          }>;
        }
      >();

      const errors: { row: number; error: string }[] = [];
      let processedCount = 0;

      input.data.forEach((row, index) => {
        const member = podToMember.get(row.podNumber);
        if (!member) {
          errors.push({ row: index + 1, error: `Unknown POD: ${row.podNumber}` });
          return;
        }

        const date = new Date(row.timestamp);
        if (isNaN(date.getTime())) {
          errors.push({ row: index + 1, error: `Invalid timestamp: ${row.timestamp}` });
          return;
        }

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${row.podNumber}-${year}-${month}`;

        if (!dataByPodAndMonth.has(key)) {
          dataByPodAndMonth.set(key, {
            memberId: member.id,
            year,
            month,
            dataPoints: [],
          });
        }

        dataByPodAndMonth.get(key)!.dataPoints.push({
          timestamp: row.timestamp,
          consumptionKwh: row.consumptionKwh,
          productionKwh: row.productionKwh,
        });
        processedCount++;
      });

      // Store load curves and calculate aggregations
      for (const [key, data] of dataByPodAndMonth.entries()) {
        // Sort data points by timestamp
        data.dataPoints.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Calculate totals
        const totalConsumption = data.dataPoints.reduce(
          (sum, dp) => sum + dp.consumptionKwh,
          0
        );
        const totalProduction = data.dataPoints.reduce(
          (sum, dp) => sum + dp.productionKwh,
          0
        );

        // Create load curve record
        const loadCurveId = createId();
        const firstTimestamp = new Date(data.dataPoints[0]!.timestamp);
        const lastTimestamp = new Date(
          data.dataPoints[data.dataPoints.length - 1]!.timestamp
        );

        await ctx.db.insert(loadCurve).values({
          id: loadCurveId,
          organizationId: input.orgId,
          memberId: data.memberId,
          periodStart: firstTimestamp,
          periodEnd: lastTimestamp,
          intervalMinutes: 15,
          dataPoints: data.dataPoints,
          totalConsumptionKwh: totalConsumption.toFixed(4),
          totalProductionKwh: totalProduction.toFixed(4),
          sourceFile: input.sourceFile,
        });

        // Calculate self-consumption (min of production and consumption at each interval)
        let selfConsumption = 0;
        for (const dp of data.dataPoints) {
          selfConsumption += Math.min(dp.consumptionKwh, dp.productionKwh);
        }

        // For now, use simplified distribution (can be enhanced with actual algorithm)
        const gridConsumption = Math.max(0, totalConsumption - totalProduction);
        const communityConsumption = Math.max(0, totalConsumption - selfConsumption - gridConsumption);
        const exportedToCommunity = Math.max(0, totalProduction - selfConsumption);
        const exportedToGrid = Math.max(0, exportedToCommunity * 0.1); // Simplified

        // Upsert monthly aggregation
        const existingAgg = await ctx.db.query.monthlyAggregation.findFirst({
          where: and(
            eq(monthlyAggregation.memberId, data.memberId),
            eq(monthlyAggregation.year, data.year),
            eq(monthlyAggregation.month, data.month)
          ),
        });

        if (existingAgg) {
          await ctx.db
            .update(monthlyAggregation)
            .set({
              totalConsumptionKwh: totalConsumption.toFixed(4),
              totalProductionKwh: totalProduction.toFixed(4),
              selfConsumptionKwh: selfConsumption.toFixed(4),
              communityConsumptionKwh: communityConsumption.toFixed(4),
              gridConsumptionKwh: gridConsumption.toFixed(4),
              exportedToCommunityKwh: exportedToCommunity.toFixed(4),
              exportedToGridKwh: exportedToGrid.toFixed(4),
              calculatedAt: new Date(),
            })
            .where(eq(monthlyAggregation.id, existingAgg.id));
        } else {
          await ctx.db.insert(monthlyAggregation).values({
            id: createId(),
            organizationId: input.orgId,
            memberId: data.memberId,
            year: data.year,
            month: data.month,
            totalConsumptionKwh: totalConsumption.toFixed(4),
            totalProductionKwh: totalProduction.toFixed(4),
            selfConsumptionKwh: selfConsumption.toFixed(4),
            communityConsumptionKwh: communityConsumption.toFixed(4),
            gridConsumptionKwh: gridConsumption.toFixed(4),
            exportedToCommunityKwh: exportedToCommunity.toFixed(4),
            exportedToGridKwh: exportedToGrid.toFixed(4),
          });
        }
      }

      return {
        processed: processedCount,
        periods: dataByPodAndMonth.size,
        errors,
        total: input.data.length,
      };
    }),

  // Recalculate monthly aggregations
  recalculateAggregations: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId, true);

      // Get all load curves for this period
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const loadCurves = await ctx.db.query.loadCurve.findMany({
        where: and(
          eq(loadCurve.organizationId, input.orgId),
          sql`${loadCurve.periodStart} >= ${startDate}`,
          sql`${loadCurve.periodEnd} <= ${endDate}`
        ),
        with: {
          member: true,
        },
      });

      // Group by member and recalculate
      const memberData = new Map<string, { consumption: number; production: number }>();

      for (const lc of loadCurves) {
        if (!memberData.has(lc.memberId)) {
          memberData.set(lc.memberId, { consumption: 0, production: 0 });
        }
        const data = memberData.get(lc.memberId)!;
        data.consumption += parseFloat(lc.totalConsumptionKwh);
        data.production += parseFloat(lc.totalProductionKwh);
      }

      let updated = 0;
      for (const [memberId, data] of memberData.entries()) {
        const selfConsumption = Math.min(data.consumption, data.production);
        const gridConsumption = Math.max(0, data.consumption - data.production);
        const communityConsumption = Math.max(0, data.consumption - selfConsumption - gridConsumption);
        const exportedToCommunity = Math.max(0, data.production - selfConsumption);
        const exportedToGrid = Math.max(0, exportedToCommunity * 0.1);

        const existingAgg = await ctx.db.query.monthlyAggregation.findFirst({
          where: and(
            eq(monthlyAggregation.memberId, memberId),
            eq(monthlyAggregation.year, input.year),
            eq(monthlyAggregation.month, input.month)
          ),
        });

        if (existingAgg) {
          await ctx.db
            .update(monthlyAggregation)
            .set({
              totalConsumptionKwh: data.consumption.toFixed(4),
              totalProductionKwh: data.production.toFixed(4),
              selfConsumptionKwh: selfConsumption.toFixed(4),
              communityConsumptionKwh: communityConsumption.toFixed(4),
              gridConsumptionKwh: gridConsumption.toFixed(4),
              exportedToCommunityKwh: exportedToCommunity.toFixed(4),
              exportedToGridKwh: exportedToGrid.toFixed(4),
              calculatedAt: new Date(),
            })
            .where(eq(monthlyAggregation.id, existingAgg.id));
          updated++;
        }
      }

      return { updated, total: memberData.size };
    }),
});
