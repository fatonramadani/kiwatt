import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { generateCommunityForecast, type HistoricalData } from "~/lib/forecast";
import { generateRecommendations } from "~/lib/recommendations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apiKey: string }> }
) {
  try {
    const { apiKey } = await params;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      );
    }

    // Find member by API key
    const member = await db.query.organizationMember.findFirst({
      where: eq(schema.organizationMember.apiKey, apiKey),
      with: {
        organization: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Get historical data and forecast
    const historicalData = await getHistoricalData(member.organizationId);
    const forecast = generateCommunityForecast(member.organizationId, historicalData);

    // Get current surplus
    const currentHour = new Date().getHours();
    const currentForecast = forecast.forecast.find((f) => f.hour === currentHour);
    const currentSurplusKw = currentForecast?.expectedSurplusKw ?? 0;

    // Generate recommendations
    const recommendations = generateRecommendations(
      member.id,
      currentSurplusKw,
      forecast.forecast,
      forecast.optimalWindows
    );

    return NextResponse.json({
      ...recommendations,
      memberName: `${member.firstname} ${member.lastname}`,
      organization: member.organization.name,
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
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
