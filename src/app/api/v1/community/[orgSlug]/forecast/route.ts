import { NextResponse, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { generateCommunityForecast, type HistoricalData } from "~/lib/forecast";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params;

    // Find organization
    const org = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, orgSlug),
    });

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get historical data for forecast calculation
    const historicalData = await getHistoricalData(org.id);

    // Generate forecast
    const forecast = generateCommunityForecast(org.id, historicalData);

    return NextResponse.json(forecast);
  } catch (error) {
    console.error("Forecast API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getHistoricalData(orgId: string): Promise<HistoricalData> {
  // Get average daily production and consumption from last 3 months
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const aggregations = await db.query.monthlyAggregation.findMany({
    where: eq(schema.monthlyAggregation.organizationId, orgId),
  });

  if (aggregations.length === 0) {
    // Return defaults based on typical CEL
    return {
      avgDailyProductionKwh: 50,
      avgDailyConsumptionKwh: 100,
      installedCapacityKwp: 30,
    };
  }

  // Calculate averages
  const totalProduction = aggregations.reduce(
    (sum, a) => sum + parseFloat(a.totalProductionKwh),
    0
  );
  const totalConsumption = aggregations.reduce(
    (sum, a) => sum + parseFloat(a.totalConsumptionKwh),
    0
  );
  const totalMonths = aggregations.length;

  // Assume 30 days per month for daily average
  const avgDailyProductionKwh = totalProduction / totalMonths / 30;
  const avgDailyConsumptionKwh = totalConsumption / totalMonths / 30;

  // Get installed capacity from members
  const members = await db.query.organizationMember.findMany({
    where: eq(schema.organizationMember.organizationId, orgId),
  });

  const installedCapacityKwp = members.reduce((sum, m) => {
    const capacity = m.solarCapacityKwp ? parseFloat(m.solarCapacityKwp) : 0;
    return sum + capacity;
  }, 0);

  return {
    avgDailyProductionKwh,
    avgDailyConsumptionKwh,
    installedCapacityKwp: installedCapacityKwp || 30,
  };
}
