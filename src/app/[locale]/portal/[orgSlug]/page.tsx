"use client";

import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import {
  Zap,
  Sun,
  Users,
  ArrowRight,
  FileText,
  Download,
  AlertCircle,
} from "lucide-react";
import { CarbonCard } from "~/components/app/carbon-card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function PortalDashboardPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("portal");
  const locale = useLocale();

  const { data: memberData } = api.member.getMyMembership.useQuery({
    orgSlug: params.orgSlug,
  });

  const { data: summary, isLoading } = api.member.getMyPortalSummary.useQuery(
    { orgId: memberData?.organization.id ?? "" },
    { enabled: !!memberData?.organization.id }
  );

  const formatKwh = (kwh: number) => {
    return new Intl.NumberFormat(`${locale}-CH`, {
      maximumFractionDigits: 1,
    }).format(kwh) + " kWh";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(`${locale}-CH`, {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(`${locale}-CH`);
  };

  // Prepare pie chart data
  const consumptionBreakdown = summary?.currentMonth
    ? [
        { name: "Self", value: summary.currentMonth.selfConsumption, color: "#22c55e" },
        { name: "Community", value: summary.currentMonth.communityConsumption, color: "#0ea5e9" },
        { name: "Grid", value: summary.currentMonth.gridConsumption, color: "#f59e0b" },
      ].filter((d) => d.value > 0)
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pelorous-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-gray-900">
          {t("welcome")}, {memberData?.membership.firstname}
        </h1>
        <p className="mt-3 text-gray-400">{t("dashboardSubtitle")}</p>
      </div>

      {/* Unpaid Invoices Alert */}
      {summary && summary.unpaidCount > 0 && (
        <div className="flex items-center gap-4 rounded-2xl bg-amber-50 p-6">
          <div className="rounded-xl bg-amber-100 p-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              {summary.unpaidCount} {t("unpaidInvoices")}
            </p>
            <p className="text-sm text-amber-600">{t("unpaidInvoicesHint")}</p>
          </div>
          <Link
            href={`/portal/${params.orgSlug}/invoices`}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm text-white hover:bg-amber-700"
          >
            {t("viewInvoices")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Current Month Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pelorous-50 p-3">
              <Zap className="h-5 w-5 text-pelorous-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("consumption")}</p>
              <p className="text-2xl font-light text-gray-900">
                {summary?.currentMonth
                  ? formatKwh(summary.currentMonth.consumption)
                  : "—"}
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
              <p className="text-sm text-gray-400">{t("production")}</p>
              <p className="text-2xl font-light text-gray-900">
                {summary?.currentMonth
                  ? formatKwh(summary.currentMonth.production)
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-3">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">{t("communityShare")}</p>
              <p className="text-2xl font-light text-gray-900">
                {summary?.currentMonth
                  ? formatKwh(summary.currentMonth.communityConsumption)
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Carbon Impact Card */}
      {memberData?.organization.id && (
        <CarbonCard orgId={memberData.organization.id} />
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Energy Sources Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="mb-6 text-lg font-light text-gray-900">{t("energySources")}</h3>
          {consumptionBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={consumptionBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {consumptionBreakdown.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatKwh(value as number)}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-gray-400">
              {t("noData")}
            </div>
          )}
          <div className="mt-4 flex justify-center gap-6">
            {[
              { name: t("self"), color: "#22c55e" },
              { name: t("community"), color: "#0ea5e9" },
              { name: t("grid"), color: "#f59e0b" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-500">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-light text-gray-900">{t("recentInvoices")}</h3>
            <Link
              href={`/portal/${params.orgSlug}/invoices`}
              className="text-sm text-pelorous-600 hover:text-pelorous-700"
            >
              {t("viewAll")}
            </Link>
          </div>

          {summary?.recentInvoices.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
              <FileText className="h-10 w-10 text-gray-200" />
              <p className="mt-4 text-sm text-gray-400">{t("noInvoices")}</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {summary?.recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-4"
                >
                  <div>
                    <p className="font-mono text-sm text-gray-900">
                      {invoice.invoiceNumber}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("due")} {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.totalChf)}
                      </p>
                      <span
                        className={`text-xs ${
                          invoice.status === "paid"
                            ? "text-emerald-600"
                            : invoice.status === "overdue"
                              ? "text-red-500"
                              : "text-gray-500"
                        }`}
                      >
                        {t(`status.${invoice.status}`)}
                      </span>
                    </div>
                    {invoice.pdfUrl && (
                      <a
                        href={invoice.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
