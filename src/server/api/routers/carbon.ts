import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sum, desc } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationMember, monthlyAggregation } from "~/server/db/schema";

// Swiss grid CO2 factor (kg per kWh) - 2024 Swiss electricity mix
const SWISS_GRID_CO2_FACTOR_KG = 0.109;

// Equivalents for visualization
const KG_CO2_PER_TREE_YEAR = 21; // Annual CO2 absorption by a tree
const KG_CO2_PER_CAR_KM = 0.12; // Average car emissions per km

// Helper to verify org membership
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
async function verifyMembership(
  ctx: { db: any; session: { user: { id: string } } },
  orgId: string
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

  return membership;
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

// Calculate CO2 equivalents from kWh of solar consumption
function calculateCarbonImpact(solarConsumptionKwh: number) {
  const co2SavedKg = solarConsumptionKwh * SWISS_GRID_CO2_FACTOR_KG;
  return {
    co2SavedKg: Math.round(co2SavedKg * 100) / 100,
    treesEquivalent: Math.round((co2SavedKg / KG_CO2_PER_TREE_YEAR) * 10) / 10,
    carKmAvoided: Math.round(co2SavedKg / KG_CO2_PER_CAR_KM),
  };
}

export const carbonRouter = createTRPCRouter({
  // Get carbon stats for the current user's member
  getMemberCarbonStats: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const membership = await verifyMembership(ctx, input.orgId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const memberId = membership.id as string;
      const currentYear = input.year ?? new Date().getFullYear();

      // Get all monthly aggregations for this member in the specified year
      const aggregations = await ctx.db.query.monthlyAggregation.findMany({
        where: and(
          eq(monthlyAggregation.memberId, memberId),
          eq(monthlyAggregation.year, currentYear)
        ),
        orderBy: [desc(monthlyAggregation.month)],
      });

      // Calculate totals
      let totalSelfConsumption = 0;
      let totalCommunityConsumption = 0;
      const monthlyData: Array<{
        month: number;
        co2SavedKg: number;
        solarConsumptionKwh: number;
      }> = [];

      for (const agg of aggregations) {
        const selfKwh = parseFloat(agg.selfConsumptionKwh);
        const communityKwh = parseFloat(agg.communityConsumptionKwh);
        const solarTotal = selfKwh + communityKwh;

        totalSelfConsumption += selfKwh;
        totalCommunityConsumption += communityKwh;

        monthlyData.push({
          month: agg.month,
          co2SavedKg: Math.round(solarTotal * SWISS_GRID_CO2_FACTOR_KG * 100) / 100,
          solarConsumptionKwh: Math.round(solarTotal * 100) / 100,
        });
      }

      const totalSolarConsumption = totalSelfConsumption + totalCommunityConsumption;
      const impact = calculateCarbonImpact(totalSolarConsumption);

      // Get current month stats
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthAgg = aggregations.find((a) => a.month === currentMonth);
      const currentMonthSolar = currentMonthAgg
        ? parseFloat(currentMonthAgg.selfConsumptionKwh) +
          parseFloat(currentMonthAgg.communityConsumptionKwh)
        : 0;
      const currentMonthImpact = calculateCarbonImpact(currentMonthSolar);

      return {
        year: currentYear,
        totalSolarConsumptionKwh: Math.round(totalSolarConsumption * 100) / 100,
        ...impact,
        currentMonth: {
          month: currentMonth,
          solarConsumptionKwh: Math.round(currentMonthSolar * 100) / 100,
          ...currentMonthImpact,
        },
        monthlyData: monthlyData.sort((a, b) => a.month - b.month),
      };
    }),

  // Get community-wide carbon stats
  getCommunityCarbonStats: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);
      const currentYear = input.year ?? new Date().getFullYear();

      // Get aggregate stats for the entire community
      const [communityStats] = await ctx.db
        .select({
          totalSelfConsumption: sum(monthlyAggregation.selfConsumptionKwh),
          totalCommunityConsumption: sum(monthlyAggregation.communityConsumptionKwh),
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, currentYear)
          )
        );

      const totalSelfConsumption = parseFloat(communityStats?.totalSelfConsumption ?? "0");
      const totalCommunityConsumption = parseFloat(
        communityStats?.totalCommunityConsumption ?? "0"
      );
      const totalSolarConsumption = totalSelfConsumption + totalCommunityConsumption;
      const impact = calculateCarbonImpact(totalSolarConsumption);

      // Get member count
      const members = await ctx.db.query.organizationMember.findMany({
        where: eq(organizationMember.organizationId, input.orgId),
      });

      // Get top carbon savers (members with most solar consumption)
      const memberAggregations = await ctx.db
        .select({
          memberId: monthlyAggregation.memberId,
          totalSelf: sum(monthlyAggregation.selfConsumptionKwh),
          totalCommunity: sum(monthlyAggregation.communityConsumptionKwh),
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, currentYear)
          )
        )
        .groupBy(monthlyAggregation.memberId);

      // Calculate CO2 for each member and sort
      const memberCarbonData = await Promise.all(
        memberAggregations.map(async (ma) => {
          const member = await ctx.db.query.organizationMember.findFirst({
            where: eq(organizationMember.id, ma.memberId),
          });
          const solarKwh =
            parseFloat(ma.totalSelf ?? "0") + parseFloat(ma.totalCommunity ?? "0");
          return {
            memberId: ma.memberId,
            memberName: member ? `${member.firstname} ${member.lastname}` : "Unknown",
            solarConsumptionKwh: Math.round(solarKwh * 100) / 100,
            co2SavedKg: Math.round(solarKwh * SWISS_GRID_CO2_FACTOR_KG * 100) / 100,
          };
        })
      );

      const topSavers = memberCarbonData
        .sort((a, b) => b.co2SavedKg - a.co2SavedKg)
        .slice(0, 5);

      // Calculate average per member
      const averageCo2PerMember =
        memberCarbonData.length > 0
          ? Math.round(
              (impact.co2SavedKg / memberCarbonData.length) * 100
            ) / 100
          : 0;

      // Get monthly trend
      const monthlyTrend = await ctx.db
        .select({
          month: monthlyAggregation.month,
          totalSelf: sum(monthlyAggregation.selfConsumptionKwh),
          totalCommunity: sum(monthlyAggregation.communityConsumptionKwh),
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, currentYear)
          )
        )
        .groupBy(monthlyAggregation.month)
        .orderBy(monthlyAggregation.month);

      const monthlyData = monthlyTrend.map((mt) => {
        const solarKwh =
          parseFloat(mt.totalSelf ?? "0") + parseFloat(mt.totalCommunity ?? "0");
        return {
          month: mt.month,
          co2SavedKg: Math.round(solarKwh * SWISS_GRID_CO2_FACTOR_KG * 100) / 100,
          solarConsumptionKwh: Math.round(solarKwh * 100) / 100,
        };
      });

      return {
        year: currentYear,
        totalSolarConsumptionKwh: Math.round(totalSolarConsumption * 100) / 100,
        ...impact,
        memberCount: members.length,
        activeMemberCount: memberCarbonData.length,
        averageCo2PerMember,
        topSavers,
        monthlyData,
      };
    }),
});
