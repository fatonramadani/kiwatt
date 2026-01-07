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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">{t("title")}</h1>
          <p className="mt-3 text-gray-400">{t("description")}</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 focus:border-gray-200 focus:outline-none"
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
            className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 focus:border-gray-200 focus:outline-none"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-800"
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
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("stats.totalProduction")}</span>
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="mt-6 text-5xl font-light text-gray-900">
            {overview ? formatKwh(overview.totalProductionKwh) : "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("stats.totalConsumption")}</span>
            <ArrowDownRight className="h-5 w-5 text-gray-300" />
          </div>
          <p className="mt-6 text-5xl font-light text-gray-900">
            {overview ? formatKwh(overview.totalConsumptionKwh) : "-"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{t("stats.selfConsumption")}</span>
            <TrendingUp className="h-5 w-5 text-pelorous-400" />
          </div>
          <p className="mt-6 text-5xl font-light text-pelorous-600">
            {overview ? formatKwh(overview.selfConsumptionKwh) : "-"}
          </p>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="rounded-2xl border border-gray-100 bg-white p-10">
        <h2 className="text-xl font-light text-gray-900">
          {t("stats.communityConsumption")} vs {t("stats.gridConsumption")}
        </h2>

        {overview && overview.totalConsumptionKwh > 0 ? (
          <div className="mt-10 space-y-10">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t("stats.communityConsumption")}</span>
                <span className="font-medium text-gray-900">
                  {formatKwh(overview.communityConsumptionKwh)}
                </span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-pelorous-500"
                  style={{
                    width: `${(overview.communityConsumptionKwh / overview.totalConsumptionKwh) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t("stats.gridConsumption")}</span>
                <span className="font-medium text-gray-900">
                  {formatKwh(overview.gridConsumptionKwh)}
                </span>
              </div>
              <div className="mt-4 h-3 rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-gray-300"
                  style={{
                    width: `${(overview.gridConsumptionKwh / overview.totalConsumptionKwh) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-10">
              <div>
                <p className="text-gray-900">Self-sufficiency rate</p>
                <p className="mt-1 text-sm text-gray-400">{t("communityEnergy")}</p>
              </div>
              <p className="text-6xl font-light text-gray-900">
                {Math.round(
                  ((overview.totalConsumptionKwh - overview.gridConsumptionKwh) /
                    overview.totalConsumptionKwh) *
                    100
                )}
                <span className="text-3xl text-gray-300">%</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-56 flex-col items-center justify-center text-center">
            <Zap className="h-10 w-10 text-gray-200" />
            <p className="mt-6 text-gray-400">{t("noData")}</p>
          </div>
        )}
      </div>

      {/* Member Breakdown Table */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <div className="border-b border-gray-100 px-8 py-6">
          <h2 className="text-xl font-light text-gray-900">Member breakdown</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                Member
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                Consumption
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                Production
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                Self-consumption
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                Community
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                Grid
              </th>
            </tr>
          </thead>
          <tbody>
            {!aggregations || aggregations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                  {t("noDataAvailable")}
                </td>
              </tr>
            ) : (
              aggregations.map((agg) => (
                <tr key={agg.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{agg.memberName}</p>
                      <p className="mt-0.5 text-xs font-mono text-gray-400">{agg.podNumber}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatKwh(agg.totalConsumptionKwh)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatKwh(agg.totalProductionKwh)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-pelorous-600">
                    {formatKwh(agg.selfConsumptionKwh)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900">
                    {formatKwh(agg.communityConsumptionKwh)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-400">
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
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-gray-900">{t("title")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="energy-csv-upload"
            />
            <label
              htmlFor="energy-csv-upload"
              className="cursor-pointer text-sm text-gray-400 hover:text-gray-600"
            >
              {file ? file.name : t("dropzone")}
            </label>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Expected columns: podNumber, timestamp, consumptionKwh, productionKwh
          </p>

          {preview.length > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-400">Preview (first 5 rows):</p>
              <div className="mt-3 max-h-40 overflow-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-3 py-2 text-left text-gray-500">POD</th>
                      <th className="px-3 py-2 text-left text-gray-500">Timestamp</th>
                      <th className="px-3 py-2 text-right text-gray-500">Cons.</th>
                      <th className="px-3 py-2 text-right text-gray-500">Prod.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-600">{row.podnumber || row.pod}</td>
                        <td className="px-3 py-2 text-gray-500">{row.timestamp || row.datetime}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{row.consumptionkwh || row.consumption}</td>
                        <td className="px-3 py-2 text-right text-gray-600">{row.productionkwh || row.production}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="mt-6 max-h-32 overflow-auto rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {errors.slice(0, 10).map((err, i) => (
                <p key={i}>{err}</p>
              ))}
              {errors.length > 10 && (
                <p className="mt-2 font-medium">...and {errors.length - 10} more errors</p>
              )}
            </div>
          )}

          {importMutation.isSuccess && (
            <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600">
              {t("success")}: {importMutation.data.processed} data points imported for{" "}
              {importMutation.data.periods} period(s)
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleImport}
            disabled={!file || importMutation.isPending}
            className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {importMutation.isPending ? t("processing") : tCommon("import")}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            {tCommon("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
