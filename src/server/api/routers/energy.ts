import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sum, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  organization,
  organizationMember,
  loadCurve,
  monthlyAggregation,
} from "~/server/db/schema";

// Types for distribution calculation
type DataPoint = {
  timestamp: string;
  consumptionKwh: number;
  productionKwh: number;
};

type MemberInterval = {
  memberId: string;
  consumption: number;
  production: number;
  selfConsumption: number;
  net: number; // positive = surplus, negative = deficit
  priorityLevel: number;
};

type DistributionResult = {
  memberId: string;
  totalConsumption: number;
  totalProduction: number;
  selfConsumption: number;
  communityConsumption: number;
  gridConsumption: number;
  exportedToCommunity: number;
  exportedToGrid: number;
};

/**
 * Distributes community energy surplus among members based on strategy
 *
 * @param strategy - "prorata" | "equal" | "priority"
 * @param memberIntervals - Array of member data for a single 15-min interval
 * @returns Distribution of community energy for each member
 */
function distributeInterval(
  strategy: "prorata" | "equal" | "priority",
  memberIntervals: MemberInterval[]
): Map<string, { fromCommunity: number; toCommunity: number; toGrid: number }> {
  const result = new Map<string, { fromCommunity: number; toCommunity: number; toGrid: number }>();

  // Initialize result for all members
  for (const m of memberIntervals) {
    result.set(m.memberId, { fromCommunity: 0, toCommunity: 0, toGrid: 0 });
  }

  // Calculate total surplus (from producers) and total deficit (from consumers)
  const surplusMembers = memberIntervals.filter(m => m.net > 0);
  const deficitMembers = memberIntervals.filter(m => m.net < 0);

  const totalSurplus = surplusMembers.reduce((sum, m) => sum + m.net, 0);
  const totalDeficit = Math.abs(deficitMembers.reduce((sum, m) => sum + m.net, 0));

  if (totalSurplus === 0 || totalDeficit === 0) {
    // No community sharing possible - all surplus goes to grid
    for (const m of surplusMembers) {
      const r = result.get(m.memberId)!;
      r.toGrid = m.net;
    }
    return result;
  }

  // Amount that can actually be shared within community
  const communityShared = Math.min(totalSurplus, totalDeficit);
  const excessToGrid = Math.max(0, totalSurplus - totalDeficit);

  // Distribute to deficit members based on strategy
  let distributionShares: Map<string, number>;

  switch (strategy) {
    case "equal": {
      // Equal distribution among all deficit members
      const share = communityShared / deficitMembers.length;
      distributionShares = new Map(
        deficitMembers.map(m => [m.memberId, Math.min(share, Math.abs(m.net))])
      );
      break;
    }

    case "priority": {
      // Sort by priority level (lower = higher priority), then distribute
      const sorted = [...deficitMembers].sort((a, b) => a.priorityLevel - b.priorityLevel);
      distributionShares = new Map();
      let remaining = communityShared;

      for (const m of sorted) {
        const needed = Math.abs(m.net);
        const given = Math.min(needed, remaining);
        distributionShares.set(m.memberId, given);
        remaining -= given;
        if (remaining <= 0) break;
      }

      // Fill in zeros for members that didn't get anything
      for (const m of deficitMembers) {
        if (!distributionShares.has(m.memberId)) {
          distributionShares.set(m.memberId, 0);
        }
      }
      break;
    }

    case "prorata":
    default: {
      // Proportional to each member's deficit
      distributionShares = new Map(
        deficitMembers.map(m => {
          const share = (Math.abs(m.net) / totalDeficit) * communityShared;
          return [m.memberId, share];
        })
      );
      break;
    }
  }

  // Apply distribution to deficit members
  for (const m of deficitMembers) {
    const r = result.get(m.memberId)!;
    r.fromCommunity = distributionShares.get(m.memberId) ?? 0;
  }

  // Calculate how much each surplus member contributes
  // Proportional to their surplus
  for (const m of surplusMembers) {
    const r = result.get(m.memberId)!;
    const shareOfSurplus = m.net / totalSurplus;
    r.toCommunity = shareOfSurplus * communityShared;
    r.toGrid = shareOfSurplus * excessToGrid;
  }

  return result;
}

/**
 * Calculates energy distribution for all members over a period
 * Processes all 15-min intervals and aggregates results
 */
function calculateDistribution(
  strategy: "prorata" | "equal" | "priority",
  memberLoadCurves: Array<{
    memberId: string;
    priorityLevel: number;
    dataPoints: DataPoint[];
  }>
): DistributionResult[] {
  // Group all data points by timestamp
  const byTimestamp = new Map<string, MemberInterval[]>();

  for (const member of memberLoadCurves) {
    for (const dp of member.dataPoints) {
      if (!byTimestamp.has(dp.timestamp)) {
        byTimestamp.set(dp.timestamp, []);
      }

      const selfConsumption = Math.min(dp.consumptionKwh, dp.productionKwh);
      const net = dp.productionKwh - dp.consumptionKwh;

      byTimestamp.get(dp.timestamp)!.push({
        memberId: member.memberId,
        consumption: dp.consumptionKwh,
        production: dp.productionKwh,
        selfConsumption,
        net,
        priorityLevel: member.priorityLevel,
      });
    }
  }

  // Initialize results per member
  const results = new Map<string, DistributionResult>();
  for (const member of memberLoadCurves) {
    results.set(member.memberId, {
      memberId: member.memberId,
      totalConsumption: 0,
      totalProduction: 0,
      selfConsumption: 0,
      communityConsumption: 0,
      gridConsumption: 0,
      exportedToCommunity: 0,
      exportedToGrid: 0,
    });
  }

  // Process each timestamp
  for (const [_timestamp, intervals] of byTimestamp.entries()) {
    // Distribute community energy for this interval
    const distribution = distributeInterval(strategy, intervals);

    // Aggregate results
    for (const interval of intervals) {
      const r = results.get(interval.memberId)!;
      const d = distribution.get(interval.memberId)!;

      r.totalConsumption += interval.consumption;
      r.totalProduction += interval.production;
      r.selfConsumption += interval.selfConsumption;
      r.communityConsumption += d.fromCommunity;
      r.exportedToCommunity += d.toCommunity;
      r.exportedToGrid += d.toGrid;

      // Grid consumption = deficit not covered by community
      const deficit = Math.max(0, interval.consumption - interval.production);
      r.gridConsumption += Math.max(0, deficit - d.fromCommunity);
    }
  }

  return Array.from(results.values());
}

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

      // Get organization's distribution strategy
      const org = await ctx.db.query.organization.findFirst({
        where: eq(organization.id, input.orgId),
      });
      const strategy = org?.distributionStrategy ?? "prorata";

      // Get all members with their priority levels
      const memberPriorities = new Map(
        members.map((m) => [m.id, m.priorityLevel ?? 5])
      );

      // Store load curves first
      for (const [_key, data] of dataByPodAndMonth.entries()) {
        // Sort data points by timestamp
        data.dataPoints.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Calculate totals for load curve record
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
      }

      // Group data by year-month for community-wide distribution calculation
      const periodGroups = new Map<string, Array<{
        memberId: string;
        year: number;
        month: number;
        priorityLevel: number;
        dataPoints: DataPoint[];
      }>>();

      for (const [_key, data] of dataByPodAndMonth.entries()) {
        const periodKey = `${data.year}-${data.month}`;
        if (!periodGroups.has(periodKey)) {
          periodGroups.set(periodKey, []);
        }
        periodGroups.get(periodKey)!.push({
          memberId: data.memberId,
          year: data.year,
          month: data.month,
          priorityLevel: memberPriorities.get(data.memberId) ?? 5,
          dataPoints: data.dataPoints,
        });
      }

      // Calculate distribution for each period (all members together)
      for (const [_periodKey, periodMembers] of periodGroups.entries()) {
        const year = periodMembers[0]!.year;
        const month = periodMembers[0]!.month;

        // Calculate community-wide distribution using the selected strategy
        const distributions = calculateDistribution(
          strategy as "prorata" | "equal" | "priority",
          periodMembers
        );

        // Update monthly aggregations with proper distribution
        for (const dist of distributions) {
          const existingAgg = await ctx.db.query.monthlyAggregation.findFirst({
            where: and(
              eq(monthlyAggregation.memberId, dist.memberId),
              eq(monthlyAggregation.year, year),
              eq(monthlyAggregation.month, month)
            ),
          });

          const aggData = {
            totalConsumptionKwh: dist.totalConsumption.toFixed(4),
            totalProductionKwh: dist.totalProduction.toFixed(4),
            selfConsumptionKwh: dist.selfConsumption.toFixed(4),
            communityConsumptionKwh: dist.communityConsumption.toFixed(4),
            gridConsumptionKwh: dist.gridConsumption.toFixed(4),
            exportedToCommunityKwh: dist.exportedToCommunity.toFixed(4),
            exportedToGridKwh: dist.exportedToGrid.toFixed(4),
            calculatedAt: new Date(),
          };

          if (existingAgg) {
            await ctx.db
              .update(monthlyAggregation)
              .set(aggData)
              .where(eq(monthlyAggregation.id, existingAgg.id));
          } else {
            await ctx.db.insert(monthlyAggregation).values({
              id: createId(),
              organizationId: input.orgId,
              memberId: dist.memberId,
              year,
              month,
              ...aggData,
            });
          }
        }
      }

      return {
        processed: processedCount,
        periods: periodGroups.size,
        errors,
        total: input.data.length,
      };
    }),

  // Recalculate monthly aggregations with proper distribution
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

      // Get organization's distribution strategy
      const org = await ctx.db.query.organization.findFirst({
        where: eq(organization.id, input.orgId),
      });
      const strategy = org?.distributionStrategy ?? "prorata";

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

      if (loadCurves.length === 0) {
        return { updated: 0, total: 0 };
      }

      // Collect all data points per member with their priority levels
      const memberLoadCurves: Array<{
        memberId: string;
        priorityLevel: number;
        dataPoints: DataPoint[];
      }> = [];

      // Group load curves by member and collect all data points
      const memberDataMap = new Map<string, {
        priorityLevel: number;
        dataPoints: DataPoint[];
      }>();

      for (const lc of loadCurves) {
        if (!memberDataMap.has(lc.memberId)) {
          memberDataMap.set(lc.memberId, {
            priorityLevel: lc.member.priorityLevel ?? 5,
            dataPoints: [],
          });
        }
        // Add all data points from this load curve
        const points = lc.dataPoints as DataPoint[];
        memberDataMap.get(lc.memberId)!.dataPoints.push(...points);
      }

      // Convert to array format for distribution calculation
      for (const [memberId, data] of memberDataMap.entries()) {
        memberLoadCurves.push({
          memberId,
          priorityLevel: data.priorityLevel,
          dataPoints: data.dataPoints,
        });
      }

      // Calculate community-wide distribution using the selected strategy
      const distributions = calculateDistribution(
        strategy as "prorata" | "equal" | "priority",
        memberLoadCurves
      );

      // Update monthly aggregations
      let updated = 0;
      for (const dist of distributions) {
        const existingAgg = await ctx.db.query.monthlyAggregation.findFirst({
          where: and(
            eq(monthlyAggregation.memberId, dist.memberId),
            eq(monthlyAggregation.year, input.year),
            eq(monthlyAggregation.month, input.month)
          ),
        });

        const aggData = {
          totalConsumptionKwh: dist.totalConsumption.toFixed(4),
          totalProductionKwh: dist.totalProduction.toFixed(4),
          selfConsumptionKwh: dist.selfConsumption.toFixed(4),
          communityConsumptionKwh: dist.communityConsumption.toFixed(4),
          gridConsumptionKwh: dist.gridConsumption.toFixed(4),
          exportedToCommunityKwh: dist.exportedToCommunity.toFixed(4),
          exportedToGridKwh: dist.exportedToGrid.toFixed(4),
          calculatedAt: new Date(),
        };

        if (existingAgg) {
          await ctx.db
            .update(monthlyAggregation)
            .set(aggData)
            .where(eq(monthlyAggregation.id, existingAgg.id));
          updated++;
        } else {
          // Create new aggregation if it doesn't exist
          await ctx.db.insert(monthlyAggregation).values({
            id: createId(),
            organizationId: input.orgId,
            memberId: dist.memberId,
            year: input.year,
            month: input.month,
            ...aggData,
          });
          updated++;
        }
      }

      return { updated, total: memberLoadCurves.length };
    }),
});
