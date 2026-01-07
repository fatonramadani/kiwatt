"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Zap, Sun, TrendingUp, Users } from "lucide-react";

export default function PortalConsumptionPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("portal");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const { data: memberData } = api.member.getMyMembership.useQuery({
    orgSlug: params.orgSlug,
  });

  const { data: consumptionData, isLoading } = api.member.getMyConsumption.useQuery(
    { orgId: memberData?.organization.id ?? "", year },
    { enabled: !!memberData?.organization.id }
  );

  const formatKwh = (kwh: number) => {
    return new Intl.NumberFormat("fr-CH", {
      maximumFractionDigits: 1,
    }).format(kwh) + " kWh";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pelorous-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">
            {t("myConsumption")}
          </h1>
          <p className="mt-3 text-gray-400">{t("consumptionSubtitle")}</p>
        </div>
        <select
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-sm focus:border-gray-200 focus:outline-none"
        >
          {[2023, 2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pelorous-50 p-3">
              <Zap className="h-5 w-5 text-pelorous-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("totalConsumption")}</p>
              <p className="text-2xl font-light text-gray-900">
                {formatKwh(consumptionData?.totalConsumption ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <Sun className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("totalProduction")}</p>
              <p className="text-2xl font-light text-gray-900">
                {formatKwh(consumptionData?.totalProduction ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("selfSufficiency")}</p>
              <p className="text-2xl font-light text-gray-900">
                {(consumptionData?.selfSufficiency ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gray-50 p-3">
              <Users className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("communityShare")}</p>
              <p className="text-2xl font-light text-gray-900">
                {formatKwh(consumptionData?.totalCommunityConsumption ?? 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Production vs Consumption Chart */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-6 text-lg font-light text-gray-900">
          {t("productionVsConsumption")}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={consumptionData?.byMonth ?? []}>
            <XAxis dataKey="monthName" axisLine={false} tickLine={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <Tooltip
              formatter={(value) => formatKwh(value as number)}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="consumption"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
              name={t("consumption")}
            />
            <Line
              type="monotone"
              dataKey="production"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
              name={t("production")}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Energy Sources Stacked Chart */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-6 text-lg font-light text-gray-900">
          {t("energySourcesMonthly")}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={consumptionData?.byMonth ?? []}>
            <XAxis dataKey="monthName" axisLine={false} tickLine={false} />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v / 1000}k`}
            />
            <Tooltip
              formatter={(value) => formatKwh(value as number)}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
            />
            <Legend />
            <Bar
              dataKey="selfConsumption"
              stackId="a"
              fill="#22c55e"
              name={t("self")}
            />
            <Bar
              dataKey="communityConsumption"
              stackId="a"
              fill="#0ea5e9"
              name={t("community")}
            />
            <Bar
              dataKey="gridConsumption"
              stackId="a"
              fill="#f59e0b"
              name={t("grid")}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-light text-gray-900">{t("monthlyBreakdown")}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("month")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("consumption")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("production")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("self")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("community")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("grid")}
              </th>
            </tr>
          </thead>
          <tbody>
            {consumptionData?.byMonth.map((month) => (
              <tr key={month.month} className="border-b border-gray-50 last:border-0">
                <td className="px-6 py-4 text-sm text-gray-900">{month.monthName}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">
                  {formatKwh(month.consumption)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-amber-600">
                  {formatKwh(month.production)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-emerald-600">
                  {formatKwh(month.selfConsumption)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-pelorous-600">
                  {formatKwh(month.communityConsumption)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">
                  {formatKwh(month.gridConsumption)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
