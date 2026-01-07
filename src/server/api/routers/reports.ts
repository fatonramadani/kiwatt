import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql, count, desc } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  organizationMember,
  invoice,
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

export const reportsRouter = createTRPCRouter({
  // Get financial report for an organization
  getFinancialReport: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      // Get totals by status
      const statusTotals = await ctx.db
        .select({
          status: invoice.status,
          total: sql<string>`SUM(${invoice.totalChf})`,
          count: count(),
        })
        .from(invoice)
        .where(
          and(
            eq(invoice.organizationId, input.orgId),
            sql`EXTRACT(YEAR FROM ${invoice.createdAt}) = ${input.year}`
          )
        )
        .groupBy(invoice.status);

      // Calculate totals
      const byStatus: Record<string, { total: number; count: number }> = {
        draft: { total: 0, count: 0 },
        sent: { total: 0, count: 0 },
        paid: { total: 0, count: 0 },
        overdue: { total: 0, count: 0 },
        cancelled: { total: 0, count: 0 },
      };

      let totalBilled = 0;
      let totalPaid = 0;
      let outstanding = 0;

      for (const row of statusTotals) {
        const total = parseFloat(row.total ?? "0");
        byStatus[row.status] = { total, count: row.count };

        if (row.status !== "cancelled" && row.status !== "draft") {
          totalBilled += total;
        }
        if (row.status === "paid") {
          totalPaid += total;
        }
        if (row.status === "sent" || row.status === "overdue") {
          outstanding += total;
        }
      }

      // Get monthly breakdown
      const monthlyData = await ctx.db
        .select({
          month: sql<number>`EXTRACT(MONTH FROM ${invoice.createdAt})`,
          status: invoice.status,
          total: sql<string>`SUM(${invoice.totalChf})`,
          count: count(),
        })
        .from(invoice)
        .where(
          and(
            eq(invoice.organizationId, input.orgId),
            sql`EXTRACT(YEAR FROM ${invoice.createdAt}) = ${input.year}`
          )
        )
        .groupBy(sql`EXTRACT(MONTH FROM ${invoice.createdAt})`, invoice.status)
        .orderBy(sql`EXTRACT(MONTH FROM ${invoice.createdAt})`);

      // Organize by month
      const byMonth: Array<{
        month: number;
        monthName: string;
        billed: number;
        paid: number;
        outstanding: number;
        count: number;
      }> = [];

      const monthNames = [
        "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      for (let m = 1; m <= 12; m++) {
        const monthData = monthlyData.filter((d) => d.month === m);
        let billed = 0;
        let paid = 0;
        let monthOutstanding = 0;
        let monthCount = 0;

        for (const row of monthData) {
          const total = parseFloat(row.total ?? "0");
          if (row.status !== "cancelled" && row.status !== "draft") {
            billed += total;
            monthCount += row.count;
          }
          if (row.status === "paid") {
            paid += total;
          }
          if (row.status === "sent" || row.status === "overdue") {
            monthOutstanding += total;
          }
        }

        byMonth.push({
          month: m,
          monthName: monthNames[m] ?? "",
          billed,
          paid,
          outstanding: monthOutstanding,
          count: monthCount,
        });
      }

      return {
        totalBilled,
        totalPaid,
        outstanding,
        collectionRate: totalBilled > 0 ? (totalPaid / totalBilled) * 100 : 0,
        byStatus,
        byMonth,
      };
    }),

  // Get energy report for an organization
  getEnergyReport: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      // Get aggregated energy data by month
      const monthlyData = await ctx.db
        .select({
          month: monthlyAggregation.month,
          totalConsumption: sql<string>`SUM(${monthlyAggregation.totalConsumptionKwh})`,
          totalProduction: sql<string>`SUM(${monthlyAggregation.totalProductionKwh})`,
          selfConsumption: sql<string>`SUM(${monthlyAggregation.selfConsumptionKwh})`,
          communityConsumption: sql<string>`SUM(${monthlyAggregation.communityConsumptionKwh})`,
          gridConsumption: sql<string>`SUM(${monthlyAggregation.gridConsumptionKwh})`,
          exportedToCommunity: sql<string>`SUM(${monthlyAggregation.exportedToCommunityKwh})`,
          exportedToGrid: sql<string>`SUM(${monthlyAggregation.exportedToGridKwh})`,
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, input.year)
          )
        )
        .groupBy(monthlyAggregation.month)
        .orderBy(monthlyAggregation.month);

      // Calculate totals
      let totalProduction = 0;
      let totalConsumption = 0;
      let totalSelfConsumption = 0;
      let totalCommunityConsumption = 0;
      let totalGridConsumption = 0;

      const monthNames = [
        "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const byMonth: Array<{
        month: number;
        monthName: string;
        production: number;
        consumption: number;
        selfConsumption: number;
        community: number;
        grid: number;
      }> = [];

      for (let m = 1; m <= 12; m++) {
        const data = monthlyData.find((d) => d.month === m);
        const production = parseFloat(data?.totalProduction ?? "0");
        const consumption = parseFloat(data?.totalConsumption ?? "0");
        const selfConsumption = parseFloat(data?.selfConsumption ?? "0");
        const community = parseFloat(data?.communityConsumption ?? "0");
        const grid = parseFloat(data?.gridConsumption ?? "0");

        totalProduction += production;
        totalConsumption += consumption;
        totalSelfConsumption += selfConsumption;
        totalCommunityConsumption += community;
        totalGridConsumption += grid;

        byMonth.push({
          month: m,
          monthName: monthNames[m] ?? "",
          production,
          consumption,
          selfConsumption,
          community,
          grid,
        });
      }

      // Calculate self-sufficiency (% of consumption covered by local production)
      const selfSufficiency =
        totalConsumption > 0
          ? ((totalSelfConsumption + totalCommunityConsumption) / totalConsumption) * 100
          : 0;

      // Get member breakdown
      const memberData = await ctx.db.query.monthlyAggregation.findMany({
        where: and(
          eq(monthlyAggregation.organizationId, input.orgId),
          eq(monthlyAggregation.year, input.year)
        ),
        with: {
          member: true,
        },
      });

      // Aggregate by member
      const memberMap = new Map<
        string,
        {
          memberId: string;
          memberName: string;
          consumption: number;
          production: number;
        }
      >();

      for (const row of memberData) {
        const existing = memberMap.get(row.memberId);
        const consumption = parseFloat(row.totalConsumptionKwh);
        const production = parseFloat(row.totalProductionKwh);

        if (existing) {
          existing.consumption += consumption;
          existing.production += production;
        } else {
          memberMap.set(row.memberId, {
            memberId: row.memberId,
            memberName: `${row.member.firstname} ${row.member.lastname}`,
            consumption,
            production,
          });
        }
      }

      const byMember = Array.from(memberMap.values())
        .filter((m) => m.memberName !== "Admin Admin")
        .sort((a, b) => b.consumption - a.consumption);

      return {
        totalProduction,
        totalConsumption,
        totalSelfConsumption,
        totalCommunityConsumption,
        totalGridConsumption,
        selfSufficiency,
        byMonth,
        byMember,
      };
    }),

  // Get top consumers
  getTopConsumers: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const consumptionData = await ctx.db
        .select({
          memberId: monthlyAggregation.memberId,
          totalConsumption: sql<string>`SUM(${monthlyAggregation.totalConsumptionKwh})`,
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, input.year)
          )
        )
        .groupBy(monthlyAggregation.memberId)
        .orderBy(desc(sql`SUM(${monthlyAggregation.totalConsumptionKwh})`))
        .limit(input.limit);

      // Get member details
      const members = await ctx.db.query.organizationMember.findMany({
        where: eq(organizationMember.organizationId, input.orgId),
      });

      const memberMap = new Map(members.map((m) => [m.id, m]));

      return consumptionData
        .map((row) => {
          const member = memberMap.get(row.memberId);
          return {
            memberId: row.memberId,
            memberName: member ? `${member.firstname} ${member.lastname}` : "Unknown",
            consumption: parseFloat(row.totalConsumption ?? "0"),
          };
        })
        .filter((m) => m.memberName !== "Admin Admin");
    }),

  // Get top producers
  getTopProducers: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        year: z.number(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      await verifyMembership(ctx, input.orgId);

      const productionData = await ctx.db
        .select({
          memberId: monthlyAggregation.memberId,
          totalProduction: sql<string>`SUM(${monthlyAggregation.totalProductionKwh})`,
        })
        .from(monthlyAggregation)
        .where(
          and(
            eq(monthlyAggregation.organizationId, input.orgId),
            eq(monthlyAggregation.year, input.year),
            sql`${monthlyAggregation.totalProductionKwh} > 0`
          )
        )
        .groupBy(monthlyAggregation.memberId)
        .orderBy(desc(sql`SUM(${monthlyAggregation.totalProductionKwh})`))
        .limit(input.limit);

      // Get member details
      const members = await ctx.db.query.organizationMember.findMany({
        where: eq(organizationMember.organizationId, input.orgId),
      });

      const memberMap = new Map(members.map((m) => [m.id, m]));

      return productionData
        .map((row) => {
          const member = memberMap.get(row.memberId);
          return {
            memberId: row.memberId,
            memberName: member ? `${member.firstname} ${member.lastname}` : "Unknown",
            production: parseFloat(row.totalProduction ?? "0"),
          };
        })
        .filter((m) => m.memberName !== "Admin Admin");
    }),
});
