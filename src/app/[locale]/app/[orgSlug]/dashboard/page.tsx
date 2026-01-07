"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Link } from "~/i18n/navigation";
import {
  Users,
  TrendingUp,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { SetupChecklist } from "~/components/app/setup-checklist";

export default function DashboardPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const locale = useLocale();

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

  const { data: overdueData } = api.invoice.getOverdueCount.useQuery(
    { orgId: org?.id ?? "" },
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
    return new Intl.NumberFormat(`${locale}-CH`, {
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
    <div className="space-y-12">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-gray-900">
          {org?.name ?? t("title")}
        </h1>
        <p className="mt-3 text-gray-400">
          {t("overview")}
        </p>
      </div>

      {/* Setup checklist */}
      {needsOnboarding && stats?.setupStatus && (
        <SetupChecklist orgSlug={params.orgSlug} setupStatus={stats.setupStatus} />
      )}

      {/* Overdue invoices alert */}
      {overdueData && overdueData.overdueCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50/50 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-800">
                {t("overdueAlert.title", { count: overdueData.overdueCount })}
              </p>
              <p className="mt-0.5 text-sm text-red-600">
                {t("overdueAlert.description")}
              </p>
            </div>
          </div>
          <Link
            href={`/app/${params.orgSlug}/invoices?status=overdue`}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm text-white transition-colors hover:bg-red-700"
          >
            {t("viewInvoices")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:gap-6 md:gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Members */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("stats.totalMembers")}</span>
            <Users className="h-5 w-5 text-gray-300" />
          </div>
          <p className="mt-6 text-5xl font-light text-gray-900">
            {statsLoading ? "-" : stats?.totalMembers ?? 0}
          </p>
        </div>

        {/* Production */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("stats.totalProduction")}</span>
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-6 text-5xl font-light text-gray-900">
            {stats?.hasEnergyData ? formatKwh(stats?.totalProduction) : "-"}
          </p>
          {!stats?.hasEnergyData && (
            <Link
              href={`/app/${params.orgSlug}/energy`}
              className="mt-4 inline-block text-sm text-gray-400 underline decoration-gray-200 underline-offset-4 hover:text-gray-600"
            >
              {t("setup.step3")}
            </Link>
          )}
        </div>

        {/* Consumption */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("stats.totalConsumption")}</span>
            <ArrowDownRight className="h-5 w-5 text-gray-300" />
          </div>
          <p className="mt-6 text-5xl font-light text-gray-900">
            {stats?.hasEnergyData ? formatKwh(stats?.totalConsumption) : "-"}
          </p>
          {!stats?.hasEnergyData && (
            <Link
              href={`/app/${params.orgSlug}/energy`}
              className="mt-4 inline-block text-sm text-gray-400 underline decoration-gray-200 underline-offset-4 hover:text-gray-600"
            >
              {t("setup.step3")}
            </Link>
          )}
        </div>

        {/* Savings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("stats.savings")}</span>
            <TrendingUp className="h-5 w-5 text-pelorous-400" />
          </div>
          <p className="mt-6 text-5xl font-light text-pelorous-600">
            {stats?.hasTariff && stats.estimatedSavings !== null
              ? formatCurrency(stats.estimatedSavings)
              : "-"}
          </p>
          {!stats?.hasTariff && (
            <Link
              href={`/app/${params.orgSlug}/settings`}
              className="mt-4 inline-block text-sm text-gray-400 underline decoration-gray-200 underline-offset-4 hover:text-gray-600"
            >
              {t("configureToSee")}
            </Link>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:gap-8 lg:gap-10 lg:grid-cols-3">
        {/* Energy distribution */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 lg:p-10 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-light text-gray-900">
                {t("charts.distribution")}
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                {stats?.currentMonth}/{stats?.currentYear}
              </p>
            </div>
            {stats?.hasEnergyData && (
              <Link
                href={`/app/${params.orgSlug}/energy`}
                className="text-sm text-gray-400 underline decoration-gray-200 underline-offset-4 hover:text-gray-600"
              >
                {t("viewDetails")}
              </Link>
            )}
          </div>

          <div className="mt-10">
            {stats?.hasEnergyData &&
            stats.communityConsumption !== null &&
            stats.gridConsumption !== null &&
            (stats.communityConsumption > 0 || stats.gridConsumption > 0) ? (
              <div className="space-y-10">
                {/* Community */}
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t("energySources.community")}</span>
                    <span className="font-medium text-gray-900">
                      {formatKwh(stats.communityConsumption)}
                    </span>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-pelorous-500"
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
                    <span className="text-gray-400">{t("energySources.grid")}</span>
                    <span className="font-medium text-gray-900">
                      {formatKwh(stats.gridConsumption)}
                    </span>
                  </div>
                  <div className="mt-4 h-3 rounded-full bg-gray-100">
                    <div
                      className="h-3 rounded-full bg-gray-300"
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
                <div className="flex items-center justify-between border-t border-gray-100 pt-10">
                  <div>
                    <p className="text-gray-900">{t("selfSufficiency.title")}</p>
                    <p className="mt-1 text-sm text-gray-400">{t("selfSufficiency.description")}</p>
                  </div>
                  <p className="text-6xl font-light text-gray-900">
                    {stats.totalConsumption && stats.totalConsumption > 0
                      ? Math.round(
                          (stats.communityConsumption / stats.totalConsumption) * 100
                        )
                      : 0}
                    <span className="text-3xl text-gray-300">%</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-56 flex-col items-center justify-center">
                <Zap className="h-10 w-10 text-gray-200" />
                <p className="mt-6 text-gray-400">{t("emptyState.noEnergyData")}</p>
                <Link
                  href={`/app/${params.orgSlug}/energy`}
                  className="mt-3 text-sm text-gray-400 underline decoration-gray-200 underline-offset-4 hover:text-gray-600"
                >
                  {t("emptyState.importHint")}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 lg:p-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-light text-gray-900">{t("recentActivity")}</h2>
            {activity?.recentInvoices && activity.recentInvoices.length > 0 && (
              <Link
                href={`/app/${params.orgSlug}/invoices`}
                className="text-sm text-gray-400 underline decoration-gray-200 underline-offset-4 hover:text-gray-600"
              >
                {t("viewAll")}
              </Link>
            )}
          </div>

          <div className="mt-8">
            {activity?.recentInvoices && activity.recentInvoices.length > 0 ? (
              <div className="space-y-5">
                {activity.recentInvoices.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between border-b border-gray-50 pb-5 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      <p className="mt-1.5 text-xs text-gray-400">
                        {new Date(item.date).toLocaleDateString(`${locale}-CH`)}
                      </p>
                    </div>
                    <span
                      className={`text-xs ${
                        item.status === "paid"
                          ? "text-emerald-500"
                          : item.status === "sent"
                            ? "text-pelorous-500"
                            : "text-gray-400"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-gray-400">
                {t("emptyState.noActivity")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Pending invoices */}
      {stats && stats.pendingInvoices > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-100 bg-amber-50/30 p-8">
          <div className="flex items-center gap-5">
            <FileText className="h-6 w-6 text-amber-500" />
            <div>
              <p className="text-gray-900">
                {t("stats.pendingInvoices")}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {t("emptyState.pendingInvoicesHint", { count: stats.pendingInvoices })}
              </p>
            </div>
          </div>
          <Link
            href={`/app/${params.orgSlug}/invoices`}
            className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm text-white transition-colors hover:bg-gray-800"
          >
            {tNav("invoices")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
