"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import {
  Plus,
  Search,
  Eye,
  Send,
  Check,
  Trash2,
  X,
  FileText,
} from "lucide-react";

type StatusFilter = "all" | "draft" | "sent" | "paid" | "overdue" | "cancelled";

export default function InvoicesPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);

  const { data: org } = api.organization.getBySlug.useQuery({
    slug: params.orgSlug,
  });

  const {
    data: invoicesData,
    refetch,
    isLoading,
  } = api.invoice.list.useQuery(
    {
      orgId: org?.id ?? "",
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
    },
    { enabled: !!org?.id }
  );

  const { data: stats } = api.invoice.getStats.useQuery(
    { orgId: org?.id ?? "" },
    { enabled: !!org?.id }
  );

  const updateStatusMutation = api.invoice.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const deleteMutation = api.invoice.delete.useMutation({
    onSuccess: () => refetch(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-CH");
  };

  const statusTabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: Object.values(stats ?? {}).reduce((a, b) => a + b.count, 0) },
    { id: "draft", label: t("status.draft"), count: stats?.draft.count },
    { id: "sent", label: t("status.sent"), count: stats?.sent.count },
    { id: "paid", label: t("status.paid"), count: stats?.paid.count },
    { id: "overdue", label: t("status.overdue"), count: stats?.overdue.count },
  ];

  const handleMarkSent = (invoiceId: string) => {
    updateStatusMutation.mutate({ invoiceId, status: "sent" });
  };

  const handleMarkPaid = (invoiceId: string) => {
    updateStatusMutation.mutate({ invoiceId, status: "paid" });
  };

  const handleDelete = (invoiceId: string) => {
    if (confirm("Delete this invoice?")) {
      deleteMutation.mutate({ invoiceId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">{t("title")}</h1>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          {t("generate")}
        </button>
      </div>

      {/* Generate Modal */}
      {showGenerate && org && (
        <GenerateModal
          orgId={org.id}
          onClose={() => setShowGenerate(false)}
          onSuccess={() => {
            setShowGenerate(false);
            refetch();
          }}
        />
      )}

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-4 py-2 text-sm ${
              statusFilter === tab.id
                ? "border-b-2 border-gray-900 font-medium text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-gray-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.number")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.member")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.period")}
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                {t("table.amount")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.status")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                {t("table.dueDate")}
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  {tCommon("loading")}
                </td>
              </tr>
            ) : invoicesData?.invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <FileText className="mx-auto h-8 w-8 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">No invoices found</p>
                </td>
              </tr>
            ) : (
              invoicesData?.invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/${params.orgSlug}/invoices/${invoice.id}`}
                      className="font-mono text-sm text-gray-900 hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-gray-900">{invoice.memberName}</p>
                      <p className="text-xs text-gray-400">{invoice.memberEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.totalChf)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        invoice.status === "paid"
                          ? "bg-green-50 text-green-700"
                          : invoice.status === "sent"
                            ? "bg-blue-50 text-blue-700"
                            : invoice.status === "overdue"
                              ? "bg-red-50 text-red-700"
                              : invoice.status === "cancelled"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t(`status.${invoice.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/app/${params.orgSlug}/invoices/${invoice.id}`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title={t("actions.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {invoice.status === "draft" && (
                        <button
                          onClick={() => handleMarkSent(invoice.id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                          title={t("actions.send")}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {invoice.status === "sent" && (
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                          title={t("actions.markPaid")}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {invoice.status === "draft" && (
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                          title={t("actions.delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {invoicesData && (
        <div className="text-sm text-gray-500">
          {invoicesData.total} invoice(s)
        </div>
      )}
    </div>
  );
}

// Generate Modal
function GenerateModal({
  orgId,
  onClose,
  onSuccess,
}: {
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const generateMutation = api.invoice.generate.useMutation({
    onSuccess: (result) => {
      if (result.created > 0) {
        onSuccess();
      }
    },
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handleGenerate = () => {
    generateMutation.mutate({ orgId, year, month });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">{t("generate")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500">
            Generate invoices for all members based on their energy consumption for the selected period.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              >
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
              >
                {[2023, 2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {generateMutation.isError && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700">
              {generateMutation.error.message}
            </div>
          )}

          {generateMutation.isSuccess && (
            <div className="rounded bg-green-50 p-3 text-sm text-green-700">
              {generateMutation.data.created} invoice(s) created
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {generateMutation.isPending ? tCommon("loading") : t("generate")}
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
