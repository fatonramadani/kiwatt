"use client";

import { useTranslations } from "next-intl";
import { Leaf, TreePine, Car, TrendingUp } from "lucide-react";
import { api } from "~/trpc/react";

interface CarbonCardProps {
  orgId: string;
  year?: number;
}

export function CarbonCard({ orgId, year }: CarbonCardProps) {
  const t = useTranslations("carbon");
  const currentYear = year ?? new Date().getFullYear();

  const { data: stats, isLoading } = api.carbon.getMemberCarbonStats.useQuery(
    { orgId, year: currentYear },
    { enabled: !!orgId }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
        <div className="h-4 w-24 rounded bg-gray-100" />
        <div className="mt-6 h-10 w-32 rounded bg-gray-100" />
        <div className="mt-4 h-3 w-40 rounded bg-gray-100" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{t("title")}</span>
        <Leaf className="h-5 w-5 text-gray-300" />
      </div>

      <p className="mt-6 text-5xl font-light text-gray-900">
        {stats.co2SavedKg.toLocaleString()}
        <span className="ml-1 text-xl text-gray-300">kg</span>
      </p>
      <p className="mt-2 text-sm text-gray-400">{t("thisYear")}</p>

      <div className="mt-8 grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
        <div className="flex items-center gap-2">
          <TreePine className="h-4 w-4 text-gray-300" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {stats.treesEquivalent}
            </p>
            <p className="text-xs text-gray-400">{t("trees")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-gray-300" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              {stats.carKmAvoided}
            </p>
            <p className="text-xs text-gray-400">km</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-emerald-600">
              {stats.currentMonth.co2SavedKg}
            </p>
            <p className="text-xs text-gray-400">{t("thisMonthShort")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
