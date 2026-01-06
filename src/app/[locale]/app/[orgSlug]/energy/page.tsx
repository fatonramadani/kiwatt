"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import {
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  X,
  TrendingUp,
} from "lucide-react";

export default function EnergyPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("energy");
  const tCommon = useTranslations("common");

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [showImport, setShowImport] = useState(false);

  const { data: org } = api.organization.getBySlug.useQuery({
    slug: params.orgSlug,
  });

  const { data: periods } = api.energy.getAvailablePeriods.useQuery(
    { orgId: org?.id ?? "" },
    { enabled: !!org?.id }
  );

  const { data: overview, refetch: refetchOverview } = api.energy.getOverview.useQuery(
    { orgId: org?.id ?? "", year, month },
    { enabled: !!org?.id }
  );

  const { data: aggregations, refetch: refetchAggregations } = api.energy.getMonthlyAggregations.useQuery(
    { orgId: org?.id ?? "", year, month },
    { enabled: !!org?.id }
  );

  const formatKwh = (kwh: number) => {
    if (kwh >= 1000) {
      return `${(kwh / 1000).toFixed(1)} MWh`;
    }
    return `${kwh.toFixed(0)} kWh`;
  };

  const handleRefetch = () => {
    refetchOverview();
    refetchAggregations();
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          >
            {months.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
          >
            <Upload className="h-4 w-4" />
            {t("import.title")}
          </button>
        </div>
      </div>

      {/* Import Modal */}
      {showImport && org && (
        <ImportEnergyModal
          orgId={org.id}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            handleRefetch();
          }}
        />
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("stats.totalProduction")}</span>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-medium text-gray-900">
            {overview ? formatKwh(overview.totalProductionKwh) : "-"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("stats.totalConsumption")}</span>
            <ArrowDownRight className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-medium text-gray-900">
            {overview ? formatKwh(overview.totalConsumptionKwh) : "-"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t("stats.selfConsumption")}</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-medium text-green-600">
            {overview ? formatKwh(overview.selfConsumptionKwh) : "-"}
          </p>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-base font-medium text-gray-900">
          {t("stats.communityConsumption")} vs {t("stats.gridConsumption")}
        </h2>

        {overview && overview.totalConsumptionKwh > 0 ? (
          <div className="mt-6 space-y-6">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("stats.communityConsumption")}</span>
                <span className="font-medium text-gray-900">
                  {formatKwh(overview.communityConsumptionKwh)}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-gray-900"
                  style={{
                    width: `${(overview.communityConsumptionKwh / overview.totalConsumptionKwh) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("stats.gridConsumption")}</span>
                <span className="font-medium text-gray-900">
                  {formatKwh(overview.gridConsumptionKwh)}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-gray-400"
                  style={{
                    width: `${(overview.gridConsumptionKwh / overview.totalConsumptionKwh) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <div>
                <p className="text-sm text-gray-600">Self-sufficiency rate</p>
              </div>
              <p className="text-4xl font-medium text-gray-900">
                {Math.round(
                  ((overview.totalConsumptionKwh - overview.gridConsumptionKwh) /
                    overview.totalConsumptionKwh) *
                    100
                )}
                %
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-center">
            <Zap className="h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">No energy data for this period</p>
          </div>
        )}
      </div>

      {/* Member Breakdown Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-base font-medium text-gray-900">Member breakdown</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Member
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Consumption
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Production
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Self-consumption
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Community
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                Grid
              </th>
            </tr>
          </thead>
          <tbody>
            {!aggregations || aggregations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
              aggregations.map((agg) => (
                <tr key={agg.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{agg.memberName}</p>
                      <p className="text-xs text-gray-400">{agg.podNumber}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {formatKwh(agg.totalConsumptionKwh)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {formatKwh(agg.totalProductionKwh)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {formatKwh(agg.selfConsumptionKwh)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900">
                    {formatKwh(agg.communityConsumptionKwh)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {formatKwh(agg.gridConsumptionKwh)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Import Energy Modal
function ImportEnergyModal({
  orgId,
  onClose,
  onSuccess,
}: {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("energy.import");
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const importMutation = api.energy.importLoadCurve.useMutation({
    onSuccess: (result) => {
      if (result.errors.length > 0) {
        setErrors(result.errors.map((e) => `Row ${e.row}: ${e.error}`));
      } else {
        onSuccess();
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase());

      if (!headers) return;

      const data = lines
        .slice(1)
        .filter((line) => line.trim())
        .slice(0, 5)
        .map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i] ?? "";
          });
          return row;
        });

      setPreview(data);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0]?.split(",").map((h) => h.trim().toLowerCase());

      if (!headers) return;

      const data = lines
        .slice(1)
        .filter((line) => line.trim())
        .map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i] ?? "";
          });
          return {
            podNumber: row.podnumber || row["pod number"] || row.pod || "",
            timestamp: row.timestamp || row.datetime || row.date || "",
            consumptionKwh: parseFloat(row.consumptionkwh || row.consumption || "0"),
            productionKwh: parseFloat(row.productionkwh || row.production || "0"),
          };
        })
        .filter((d) => d.podNumber && d.timestamp);

      importMutation.mutate({
        orgId,
        data,
        sourceFile: file.name,
      });
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{t("title")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="energy-csv-upload"
            />
            <label
              htmlFor="energy-csv-upload"
              className="cursor-pointer text-sm text-gray-500 hover:text-gray-700"
            >
              {file ? file.name : t("dropzone")}
            </label>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Expected columns: podNumber, timestamp, consumptionKwh, productionKwh
          </p>

          {preview.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Preview (first 5 rows):</p>
              <div className="mt-2 max-h-40 overflow-auto rounded border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-2 py-1 text-left">POD</th>
                      <th className="px-2 py-1 text-left">Timestamp</th>
                      <th className="px-2 py-1 text-right">Cons.</th>
                      <th className="px-2 py-1 text-right">Prod.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="px-2 py-1">{row.podnumber || row.pod}</td>
                        <td className="px-2 py-1">{row.timestamp || row.datetime}</td>
                        <td className="px-2 py-1 text-right">{row.consumptionkwh || row.consumption}</td>
                        <td className="px-2 py-1 text-right">{row.productionkwh || row.production}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-4 max-h-32 overflow-auto rounded bg-red-50 p-3 text-sm text-red-700">
              {errors.slice(0, 10).map((err, i) => (
                <p key={i}>{err}</p>
              ))}
              {errors.length > 10 && (
                <p className="mt-1 font-medium">...and {errors.length - 10} more errors</p>
              )}
            </div>
          )}

          {importMutation.isSuccess && (
            <div className="mt-4 rounded bg-green-50 p-3 text-sm text-green-700">
              {t("success")}: {importMutation.data.processed} data points imported for{" "}
              {importMutation.data.periods} period(s)
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {importMutation.isPending ? t("processing") : tCommon("import")}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            {tCommon("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
