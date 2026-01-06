"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Link } from "~/i18n/navigation";
import {
  Users,
  TrendingUp,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from "lucide-react";
import { SetupChecklist } from "~/components/app/setup-checklist";

export default function DashboardPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");

  const { data: org } = api.organization.getBySlug.useQuery({
    slug: params.orgSlug,
  });

  const { data: stats, isLoading: statsLoading } =
    api.organization.getDashboardStats.useQuery(
      { orgId: org?.id ?? "" },
      { enabled: !!org?.id }
    );

  const { data: activity } = api.organization.getRecentActivity.useQuery(
    { orgId: org?.id ?? "", limit: 5 },
    { enabled: !!org?.id }
  );

  const formatKwh = (kwh: number | null | undefined) => {
    if (kwh === null || kwh === undefined) return "-";
    if (kwh >= 1000) {
      return `${(kwh / 1000).toFixed(1)} MWh`;
    }
    return `${kwh.toFixed(0)} kWh`;
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const needsOnboarding =
    stats?.setupStatus &&
    (!stats.setupStatus.hasMembers ||
      !stats.setupStatus.hasTariff ||
      !stats.setupStatus.hasEnergyData);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-normal text-gray-900">
          {org?.name ?? t("title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("overview")}
        </p>
      </div>

      {/* Setup checklist */}
      {needsOnboarding && stats?.setupStatus && (
        <SetupChecklist orgSlug={params.orgSlug} setupStatus={stats.setupStatus} />
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Members */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("stats.totalMembers")}</span>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-medium text-gray-900">
            {statsLoading ? "-" : stats?.totalMembers ?? 0}
          </p>
        </div>

        {/* Production */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("stats.totalProduction")}</span>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-medium text-gray-900">
            {stats?.hasEnergyData ? formatKwh(stats?.totalProduction) : "-"}
          </p>
          {!stats?.hasEnergyData && (
            <Link
              href={`/app/${params.orgSlug}/energy`}
              className="mt-2 block text-sm text-gray-400 hover:text-gray-600"
            >
              {t("setup.step3")}
            </Link>
          )}
        </div>

        {/* Consumption */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("stats.totalConsumption")}</span>
            <ArrowDownRight className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-medium text-gray-900">
            {stats?.hasEnergyData ? formatKwh(stats?.totalConsumption) : "-"}
          </p>
          {!stats?.hasEnergyData && (
            <Link
              href={`/app/${params.orgSlug}/energy`}
              className="mt-2 block text-sm text-gray-400 hover:text-gray-600"
            >
              {t("setup.step3")}
            </Link>
          )}
        </div>

        {/* Savings */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("stats.savings")}</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-medium text-green-600">
            {stats?.hasTariff && stats.estimatedSavings !== null
              ? formatCurrency(stats.estimatedSavings)
              : "-"}
          </p>
          {!stats?.hasTariff && (
            <Link
              href={`/app/${params.orgSlug}/settings`}
              className="mt-2 block text-sm text-gray-400 hover:text-gray-600"
            >
              {t("configureToSee")}
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Energy distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-base font-medium text-gray-900">
            {t("charts.distribution")}
          </h2>
          <p className="text-sm text-gray-500">
            {stats?.currentMonth}/{stats?.currentYear}
          </p>

          <div className="mt-6">
            {stats?.hasEnergyData &&
            stats.communityConsumption !== null &&
            stats.gridConsumption !== null &&
            (stats.communityConsumption > 0 || stats.gridConsumption > 0) ? (
              <div className="space-y-6">
                {/* Community */}
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("energySources.community")}</span>
                    <span className="font-medium text-gray-900">
                      {formatKwh(stats.communityConsumption)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-gray-900"
                      style={{
                        width: `${
                          stats.totalConsumption && stats.totalConsumption > 0
                            ? (stats.communityConsumption / stats.totalConsumption) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Grid */}
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t("energySources.grid")}</span>
                    <span className="font-medium text-gray-900">
                      {formatKwh(stats.gridConsumption)}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-gray-400"
                      style={{
                        width: `${
                          stats.totalConsumption && stats.totalConsumption > 0
                            ? (stats.gridConsumption / stats.totalConsumption) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Self-sufficiency */}
                <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                  <div>
                    <p className="text-sm text-gray-600">{t("selfSufficiency.title")}</p>
                    <p className="text-xs text-gray-400">{t("selfSufficiency.description")}</p>
                  </div>
                  <p className="text-4xl font-medium text-gray-900">
                    {stats.totalConsumption && stats.totalConsumption > 0
                      ? Math.round(
                          (stats.communityConsumption / stats.totalConsumption) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center">
                <Zap className="h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">{t("emptyState.noEnergyData")}</p>
                <Link
                  href={`/app/${params.orgSlug}/energy`}
                  className="mt-2 text-sm text-gray-900 underline hover:no-underline"
                >
                  {t("emptyState.importHint")}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-base font-medium text-gray-900">{t("recentActivity")}</h2>

          <div className="mt-4">
            {activity?.recentInvoices && activity.recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {activity.recentInvoices.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between py-2"
                  >
                    <div>
                      <p className="text-sm text-gray-700">{item.description}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(item.date).toLocaleDateString("fr-CH")}
                      </p>
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs ${
                        item.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : item.status === "sent"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">
                {t("emptyState.noActivity")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pending invoices */}
      {stats && stats.pendingInvoices > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {t("stats.pendingInvoices")}
              </p>
              <p className="text-xs text-amber-700">
                {t("emptyState.pendingInvoicesHint", { count: stats.pendingInvoices })}
              </p>
            </div>
          </div>
          <Link
            href={`/app/${params.orgSlug}/invoices`}
            className="rounded bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
          >
            {tNav("invoices")}
          </Link>
        </div>
      )}
    </div>
  );
}
