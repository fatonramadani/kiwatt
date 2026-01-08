import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { getCurrentSurplusStatus, generateCommunityForecast, type HistoricalData } from "~/lib/forecast";

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

    // Get current hour's forecast as proxy for "real-time" data
    // In production, this would come from smart meter data or grid operator API
    const historicalData = await getHistoricalData(org.id);
    const forecast = generateCommunityForecast(org.id, historicalData);

    const currentHour = new Date().getHours();
    const currentForecast = forecast.forecast.find((f) => f.hour === currentHour);

    const currentProductionKw = currentForecast?.productionKw ?? 0;
    const currentConsumptionKw = currentForecast?.expectedConsumptionKw ?? 0;

    const surplus = getCurrentSurplusStatus(currentProductionKw, currentConsumptionKw);

    return NextResponse.json({
      orgId: org.id,
      ...surplus,
    });
  } catch (error) {
    console.error("Surplus API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function getHistoricalData(orgId: string): Promise<HistoricalData> {
  const aggregations = await db.query.monthlyAggregation.findMany({
    where: eq(schema.monthlyAggregation.organizationId, orgId),
  });

  if (aggregations.length === 0) {
    return {
      avgDailyProductionKwh: 50,
      avgDailyConsumptionKwh: 100,
      installedCapacityKwp: 30,
    };
  }

  const totalProduction = aggregations.reduce(
    (sum, a) => sum + parseFloat(a.totalProductionKwh),
    0
  );
  const totalConsumption = aggregations.reduce(
    (sum, a) => sum + parseFloat(a.totalConsumptionKwh),
    0
  );
  const totalMonths = aggregations.length;

  const avgDailyProductionKwh = totalProduction / totalMonths / 30;
  const avgDailyConsumptionKwh = totalConsumption / totalMonths / 30;

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
