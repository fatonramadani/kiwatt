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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Zap,
  Wallet,
  Users,
  Sun,
  Leaf,
} from "lucide-react";
import { CarbonDashboard } from "~/components/app/carbon-dashboard";

export default function ReportsPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("reports");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState<"financial" | "energy" | "carbon">("financial");

  const { data: org } = api.organization.getBySlug.useQuery({
    slug: params.orgSlug,
  });

  const { data: financialReport, isLoading: loadingFinancial } =
    api.reports.getFinancialReport.useQuery(
      { orgId: org?.id ?? "", year },
      { enabled: !!org?.id }
    );

  const { data: energyReport, isLoading: loadingEnergy } =
    api.reports.getEnergyReport.useQuery(
      { orgId: org?.id ?? "", year },
      { enabled: !!org?.id }
    );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatKwh = (kwh: number) => {
    return new Intl.NumberFormat("fr-CH", {
      maximumFractionDigits: 0,
    }).format(kwh) + " kWh";
  };

  const exportFinancialCSV = () => {
    if (!financialReport) return;

    const headers = ["Month", "Billed", "Paid", "Outstanding", "Invoice Count"];
    const rows = financialReport.byMonth.map((m) => [
      m.monthName,
      m.billed.toFixed(2),
      m.paid.toFixed(2),
      m.outstanding.toFixed(2),
      m.count.toString(),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(csv, `financial-report-${year}.csv`);
  };

  const exportEnergyCSV = () => {
    if (!energyReport) return;

    const headers = ["Month", "Production (kWh)", "Consumption (kWh)", "Community (kWh)", "Grid (kWh)"];
    const rows = energyReport.byMonth.map((m) => [
      m.monthName,
      m.production.toFixed(2),
      m.consumption.toFixed(2),
      m.community.toFixed(2),
      m.grid.toFixed(2),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(csv, `energy-report-${year}.csv`);
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const COLORS = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">{t("title")}</h1>
          <p className="mt-3 text-gray-400">{t("description")}</p>
        </div>
        <div className="flex items-center gap-4">
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
          <button
            onClick={activeTab === "financial" ? exportFinancialCSV : exportEnergyCSV}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-800"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100">
        <button
          onClick={() => setActiveTab("financial")}
          className={`flex items-center gap-2 px-5 py-3 text-sm transition-colors ${
            activeTab === "financial"
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Wallet className="h-4 w-4" />
          Financial
        </button>
        <button
          onClick={() => setActiveTab("energy")}
          className={`flex items-center gap-2 px-5 py-3 text-sm transition-colors ${
            activeTab === "energy"
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Zap className="h-4 w-4" />
          Energy
        </button>
        <button
          onClick={() => setActiveTab("carbon")}
          className={`flex items-center gap-2 px-5 py-3 text-sm transition-colors ${
            activeTab === "carbon"
              ? "border-b-2 border-gray-900 text-gray-900"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <Leaf className="h-4 w-4" />
          Carbon
        </button>
      </div>

      {activeTab === "financial" && (
        <FinancialReport
          report={financialReport}
          isLoading={loadingFinancial}
          formatCurrency={formatCurrency}
        />
      )}

      {activeTab === "energy" && (
        <EnergyReport
          report={energyReport}
          isLoading={loadingEnergy}
          formatKwh={formatKwh}
          colors={COLORS}
        />
      )}

      {activeTab === "carbon" && org?.id && (
        <CarbonDashboard orgId={org.id} year={year} showCommunityStats={true} />
      )}
    </div>
  );
}

function FinancialReport({
  report,
  isLoading,
  formatCurrency,
}: {
  report: any;
  isLoading: boolean;
  formatCurrency: (n: number) => string;
}) {
  const t = useTranslations("reports");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center text-gray-400 py-20">
        {t("noFinancialData")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pelorous-50 p-3">
              <Wallet className="h-5 w-5 text-pelorous-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Billed</p>
              <p className="text-2xl font-light text-gray-900">
                {formatCurrency(report.totalBilled)}
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
              <p className="text-sm text-gray-400">Total Paid</p>
              <p className="text-2xl font-light text-gray-900">
                {formatCurrency(report.totalPaid)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Outstanding</p>
              <p className="text-2xl font-light text-gray-900">
                {formatCurrency(report.outstanding)}
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
              <p className="text-sm text-gray-400">Collection Rate</p>
              <p className="text-2xl font-light text-gray-900">
                {report.collectionRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-6 text-lg font-light text-gray-900">Monthly Billing</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={report.byMonth}>
            <XAxis dataKey="monthName" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              formatter={(value) => formatCurrency(value as number)}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
            />
            <Legend />
            <Bar dataKey="billed" fill="#0ea5e9" name="Billed" radius={[4, 4, 0, 0]} />
            <Bar dataKey="paid" fill="#22c55e" name="Paid" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status Breakdown */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-6 text-lg font-light text-gray-900">Invoice Status Breakdown</h3>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(report.byStatus).map(([status, data]: [string, any]) => (
            <div key={status} className="text-center">
              <p className="text-2xl font-light text-gray-900">{data.count}</p>
              <p className="text-sm text-gray-400 capitalize">{status}</p>
              <p className="text-xs text-gray-300">{formatCurrency(data.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-light text-gray-900">Monthly Breakdown</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">Month</th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">Billed</th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">Paid</th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">Outstanding</th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">Invoices</th>
            </tr>
          </thead>
          <tbody>
            {report.byMonth.map((month: any) => (
              <tr key={month.month} className="border-b border-gray-50 last:border-0">
                <td className="px-6 py-4 text-sm text-gray-900">{month.monthName}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">
                  {formatCurrency(month.billed)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-emerald-600">
                  {formatCurrency(month.paid)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-amber-600">
                  {formatCurrency(month.outstanding)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-500">{month.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EnergyReport({
  report,
  isLoading,
  formatKwh,
  colors,
}: {
  report: any;
  isLoading: boolean;
  formatKwh: (n: number) => string;
  colors: string[];
}) {
  const t = useTranslations("reports");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center text-gray-400 py-20">
        {t("noEnergyData")}
      </div>
    );
  }

  const consumptionBreakdown = [
    { name: "Self", value: report.totalSelfConsumption, color: "#22c55e" },
    { name: "Community", value: report.totalCommunityConsumption, color: "#0ea5e9" },
    { name: "Grid", value: report.totalGridConsumption, color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3">
              <Sun className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Production</p>
              <p className="text-2xl font-light text-gray-900">
                {formatKwh(report.totalProduction)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pelorous-50 p-3">
              <Zap className="h-5 w-5 text-pelorous-600" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Consumption</p>
              <p className="text-2xl font-light text-gray-900">
                {formatKwh(report.totalConsumption)}
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
              <p className="text-sm text-gray-400">Self-Sufficiency</p>
              <p className="text-2xl font-light text-gray-900">
                {report.selfSufficiency.toFixed(1)}%
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
              <p className="text-sm text-gray-400">Community Share</p>
              <p className="text-2xl font-light text-gray-900">
                {formatKwh(report.totalCommunityConsumption)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Monthly Production vs Consumption */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="mb-6 text-lg font-light text-gray-900">Production vs Consumption</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={report.byMonth}>
              <XAxis dataKey="monthName" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                formatter={(value) => formatKwh(value as number)}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="production"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                name="Production"
              />
              <Line
                type="monotone"
                dataKey="consumption"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={false}
                name="Consumption"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Consumption Breakdown Pie */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <h3 className="mb-6 text-lg font-light text-gray-900">Consumption Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={consumptionBreakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
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
        </div>
      </div>

      {/* Energy Sources Chart */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h3 className="mb-6 text-lg font-light text-gray-900">Monthly Energy Sources</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={report.byMonth}>
            <XAxis dataKey="monthName" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              formatter={(value) => formatKwh(value as number)}
              contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb" }}
            />
            <Legend />
            <Bar dataKey="selfConsumption" stackId="a" fill="#22c55e" name="Self" radius={[0, 0, 0, 0]} />
            <Bar dataKey="community" stackId="a" fill="#0ea5e9" name="Community" radius={[0, 0, 0, 0]} />
            <Bar dataKey="grid" stackId="a" fill="#f59e0b" name="Grid" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Member Breakdown Table */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 p-6">
          <h3 className="text-lg font-light text-gray-900">Member Energy Summary</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">Member</th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">Consumption</th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">Production</th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">Net</th>
            </tr>
          </thead>
          <tbody>
            {report.byMember.slice(0, 10).map((member: any) => (
              <tr key={member.memberId} className="border-b border-gray-50 last:border-0">
                <td className="px-6 py-4 text-sm text-gray-900">{member.memberName}</td>
                <td className="px-6 py-4 text-right text-sm text-gray-900">
                  {formatKwh(member.consumption)}
                </td>
                <td className="px-6 py-4 text-right text-sm text-amber-600">
                  {formatKwh(member.production)}
                </td>
                <td
                  className={`px-6 py-4 text-right text-sm ${
                    member.production - member.consumption >= 0
                      ? "text-emerald-600"
                      : "text-red-500"
                  }`}
                >
                  {formatKwh(member.production - member.consumption)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
