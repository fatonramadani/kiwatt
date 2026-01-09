"use client";

import { useTranslations } from "next-intl";
import { Leaf, TreePine, Car, TrendingUp, Users } from "lucide-react";
import { api } from "~/trpc/react";

interface CarbonDashboardProps {
  orgId: string;
  year?: number;
  showCommunityStats?: boolean;
}

export function CarbonDashboard({
  orgId,
  year,
  showCommunityStats = true,
}: CarbonDashboardProps) {
  const t = useTranslations("carbon");
  const currentYear = year ?? new Date().getFullYear();

  const { data: memberStats, isLoading: loadingMember } =
    api.carbon.getMemberCarbonStats.useQuery(
      { orgId, year: currentYear },
      { enabled: !!orgId }
    );

  const { data: communityStats, isLoading: loadingCommunity } =
    api.carbon.getCommunityCarbonStats.useQuery(
      { orgId, year: currentYear },
      { enabled: !!orgId && showCommunityStats }
    );

  const isLoading = loadingMember || (showCommunityStats && loadingCommunity);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
          />
        ))}
      </div>
    );
  }

  if (!memberStats) {
    return null;
  }

  const monthNames = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className="space-y-8">
      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total CO2 Saved */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("co2Saved")}</span>
            <Leaf className="h-5 w-5 text-gray-300" />
          </div>
          <p className="mt-6 text-5xl font-light text-gray-900">
            {memberStats.co2SavedKg.toLocaleString()}
            <span className="ml-1 text-xl text-gray-300">kg</span>
          </p>
          <p className="mt-2 text-sm text-gray-400">{t("thisYear")}</p>
        </div>

        {/* Trees Equivalent */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("treesEquivalent")}</span>
            <TreePine className="h-5 w-5 text-gray-300" />
          </div>
          <p className="mt-6 text-5xl font-light text-gray-900">
            {memberStats.treesEquivalent.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-gray-400">{t("treesDesc")}</p>
        </div>

        {/* Car KM Avoided */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("carKmAvoided")}</span>
            <Car className="h-5 w-5 text-gray-300" />
          </div>
          <p className="mt-6 text-5xl font-light text-gray-900">
            {memberStats.carKmAvoided.toLocaleString()}
            <span className="ml-1 text-xl text-gray-300">km</span>
          </p>
          <p className="mt-2 text-sm text-gray-400">{t("carKmDesc")}</p>
        </div>

        {/* This Month */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("thisMonth")}</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-6 text-5xl font-light text-emerald-600">
            {memberStats.currentMonth.co2SavedKg.toLocaleString()}
            <span className="ml-1 text-xl text-gray-300">kg</span>
          </p>
          <p className="mt-2 text-sm text-gray-400">
            {memberStats.currentMonth.solarConsumptionKwh.toLocaleString()} kWh {t("solarUsed")}
          </p>
        </div>
      </div>

      {/* Monthly Trend */}
      {memberStats.monthlyData.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 lg:p-10">
          <h3 className="text-xl font-light text-gray-900">{t("monthlyTrend")}</h3>
          <div className="mt-10 flex items-end justify-between gap-3">
            {memberStats.monthlyData.map((month) => {
              const maxCo2 = Math.max(
                ...memberStats.monthlyData.map((m) => m.co2SavedKg)
              );
              const heightPercent =
                maxCo2 > 0 ? (month.co2SavedKg / maxCo2) * 100 : 0;
              return (
                <div key={month.month} className="flex flex-1 flex-col items-center">
                  <span className="mb-2 text-xs text-gray-400">
                    {month.co2SavedKg > 0 ? `${month.co2SavedKg}` : ""}
                  </span>
                  <div
                    className="w-full rounded-t bg-gray-200 transition-all"
                    style={{
                      height: `${Math.max(heightPercent * 0.8, 4)}px`,
                      minHeight: month.co2SavedKg > 0 ? "16px" : "4px",
                      maxHeight: "80px",
                    }}
                  />
                  <span className="mt-3 text-xs text-gray-400">
                    {monthNames[month.month]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Community Stats */}
      {showCommunityStats && communityStats && (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 lg:p-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-light text-gray-900">{t("communityImpact")}</h3>
            <Users className="h-5 w-5 text-gray-300" />
          </div>

          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            <div>
              <p className="text-5xl font-light text-gray-900">
                {communityStats.co2SavedKg.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-gray-400">kg CO2 {t("totalCommunitySaved")}</p>
            </div>
            <div>
              <p className="text-5xl font-light text-gray-900">
                {communityStats.activeMemberCount}
              </p>
              <p className="mt-2 text-sm text-gray-400">{t("members")} {t("contributing")}</p>
            </div>
            <div>
              <p className="text-5xl font-light text-gray-900">
                {communityStats.averageCo2PerMember.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-gray-400">kg {t("avgPerMember")}</p>
            </div>
          </div>

          {/* Top Savers */}
          {communityStats.topSavers.length > 0 && (
            <div className="mt-10 border-t border-gray-100 pt-10">
              <h4 className="text-sm text-gray-400">{t("topSavers")}</h4>
              <div className="mt-6 space-y-4">
                {communityStats.topSavers.slice(0, 5).map((saver, index) => (
                  <div
                    key={saver.memberId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-500">
                        {index + 1}
                      </span>
                      <span className="text-gray-900">{saver.memberName}</span>
                    </div>
                    <span className="text-gray-500">{saver.co2SavedKg} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
