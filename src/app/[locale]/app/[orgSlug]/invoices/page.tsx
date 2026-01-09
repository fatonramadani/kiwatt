"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
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
  Loader2,
  CreditCard,
} from "lucide-react";

type StatusFilter = "all" | "draft" | "sent" | "paid" | "overdue" | "cancelled";

export default function InvoicesPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);

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

  const sendBatchMutation = api.invoice.sendBatch.useMutation({
    onSuccess: (result) => {
      setSelectedIds(new Set());
      void refetch();
      if (result.errors.length > 0) {
        alert(`Sent ${result.sent} invoice(s). ${result.errors.length} error(s).`);
      }
    },
  });


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(`${locale}-CH`, {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(`${locale}-CH`);
  };

  const statusTabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: Object.values(stats ?? {}).reduce((a, b) => a + b.count, 0) },
    { id: "draft", label: t("status.draft"), count: stats?.draft?.count },
    { id: "sent", label: t("status.sent"), count: stats?.sent?.count },
    { id: "paid", label: t("status.paid"), count: stats?.paid?.count },
    { id: "overdue", label: t("status.overdue"), count: stats?.overdue?.count },
  ];

  const handleMarkSent = (invoiceId: string) => {
    updateStatusMutation.mutate({ invoiceId, status: "sent" });
  };

  const handleMarkPaid = (invoiceId: string) => {
    setPaymentInvoiceId(invoiceId);
    setShowPaymentModal(true);
  };

  const handleDelete = (invoiceId: string) => {
    if (confirm(t("confirmDelete"))) {
      deleteMutation.mutate({ invoiceId });
    }
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (!invoicesData) return;
    if (selectedIds.size === invoicesData.invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoicesData.invoices.map((inv) => inv.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Get selected invoices by status
  const selectedInvoices = invoicesData?.invoices.filter((inv) => selectedIds.has(inv.id)) ?? [];
  const draftSelected = selectedInvoices.filter((inv) => inv.status === "draft");
  const sendableSelected = selectedInvoices.filter((inv) => inv.status === "sent" || inv.status === "overdue");

  const handleBulkSend = () => {
    if (!org || draftSelected.length === 0) return;
    if (confirm(`Send ${draftSelected.length} invoice(s)?`)) {
      sendBatchMutation.mutate({
        orgId: org.id,
        invoiceIds: draftSelected.map((inv) => inv.id),
      });
    }
  };

  const handleBulkMarkPaid = () => {
    if (sendableSelected.length === 0) return;
    setPaymentInvoiceId(null);
    setShowPaymentModal(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">{t("title")}</h1>
          <p className="mt-3 text-gray-400">{t("description")}</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-800"
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
            void refetch();
          }}
        />
      )}

      {/* Payment Modal */}
      {showPaymentModal && org && (
        <PaymentModal
          orgId={org.id}
          invoiceId={paymentInvoiceId}
          invoiceIds={paymentInvoiceId ? null : Array.from(selectedIds).filter((id) => {
            const inv = invoicesData?.invoices.find((i) => i.id === id);
            return inv && (inv.status === "sent" || inv.status === "overdue");
          })}
          onClose={() => {
            setShowPaymentModal(false);
            setPaymentInvoiceId(null);
          }}
          onSuccess={() => {
            setShowPaymentModal(false);
            setPaymentInvoiceId(null);
            setSelectedIds(new Set());
            void refetch();
          }}
        />
      )}

      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-gray-100">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setStatusFilter(tab.id);
              setSelectedIds(new Set());
            }}
            className={`px-5 py-3 text-sm transition-colors ${
              statusFilter === tab.id
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm focus:border-gray-200 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-4 text-left">
                <input
                  type="checkbox"
                  checked={invoicesData?.invoices.length ? selectedIds.size === invoicesData.invoices.length : false}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.number")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.member")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.period")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("table.amount")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.status")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("table.dueDate")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("table.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                  {tCommon("loading")}
                </td>
              </tr>
            ) : invoicesData?.invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-gray-200" />
                  <p className="mt-4 text-sm text-gray-400">{t("noInvoices")}</p>
                </td>
              </tr>
            ) : (
              invoicesData?.invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className={`border-b border-gray-50 last:border-0 ${
                    selectedIds.has(invoice.id) ? "bg-gray-50" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invoice.id)}
                      onChange={() => handleSelect(invoice.id)}
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/app/${params.orgSlug}/invoices/${invoice.id}`}
                      className="font-mono text-sm text-gray-900 hover:text-pelorous-600"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-gray-900">{invoice.memberName}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{invoice.memberEmail}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.totalChf)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-xs ${
                        invoice.status === "paid"
                          ? "bg-emerald-50 text-emerald-600"
                          : invoice.status === "sent"
                            ? "bg-pelorous-50 text-pelorous-600"
                            : invoice.status === "overdue"
                              ? "bg-red-50 text-red-500"
                              : invoice.status === "cancelled"
                                ? "bg-gray-50 text-gray-400"
                                : "bg-gray-50 text-gray-500"
                      }`}
                    >
                      {t(`status.${invoice.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/app/${params.orgSlug}/invoices/${invoice.id}`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                        title={t("actions.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {invoice.status === "draft" && (
                        <button
                          onClick={() => handleMarkSent(invoice.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-pelorous-600"
                          title={t("actions.send")}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {(invoice.status === "sent" || invoice.status === "overdue") && (
                        <button
                          onClick={() => handleMarkPaid(invoice.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-emerald-600"
                          title={t("actions.markPaid")}
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {invoice.status === "draft" && (
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-red-500"
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
        <div className="text-sm text-gray-400">
          {invoicesData.total} invoice(s)
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-3">
              {draftSelected.length > 0 && (
                <button
                  onClick={handleBulkSend}
                  disabled={sendBatchMutation.isPending}
                  className="flex items-center gap-2 rounded-xl bg-pelorous-600 px-4 py-2 text-sm text-white hover:bg-pelorous-700 disabled:opacity-50"
                >
                  {sendBatchMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send {draftSelected.length} invoice(s)
                </button>
              )}
              {sendableSelected.length > 0 && (
                <button
                  onClick={handleBulkMarkPaid}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
                >
                  <CreditCard className="h-4 w-4" />
                  {t("markSelectedPaid", { count: sendableSelected.length })}
                </button>
              )}
            </div>
          </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-gray-900">{t("generate")}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <p className="text-sm text-gray-400">
            {t("generateDescription")}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-500">Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              >
                {months.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500">Year</label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
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
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {generateMutation.error.message}
            </div>
          )}

          {generateMutation.isSuccess && (
            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-600">
              {generateMutation.data.created} invoice(s) created
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {generateMutation.isPending ? tCommon("loading") : t("generate")}
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

// Payment Modal
function PaymentModal({
  orgId,
  invoiceId,
  invoiceIds,
  onClose,
  onSuccess,
}: {
  orgId: string;
  invoiceId: string | null;
  invoiceIds: string[] | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split("T")[0] ?? "");
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "cash" | "other">("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const markAsPaidMutation = api.invoice.markAsPaid.useMutation({
    onSuccess,
  });

  const markPaidBatchMutation = api.invoice.markPaidBatch.useMutation({
    onSuccess,
  });

  const handleSubmit = () => {
    const paymentData = {
      paidAt: new Date(paidAt),
      paymentMethod,
      paymentReference: paymentReference || undefined,
      paymentNotes: paymentNotes || undefined,
    };

    if (invoiceId) {
      markAsPaidMutation.mutate({
        invoiceId,
        ...paymentData,
      });
    } else if (invoiceIds) {
      markPaidBatchMutation.mutate({
        orgId,
        invoiceIds,
        ...paymentData,
      });
    }
  };

  const isPending = markAsPaidMutation.isPending || markPaidBatchMutation.isPending;
  const count = invoiceId ? 1 : (invoiceIds?.length ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-light text-gray-900">
            {count > 1 ? t("markSelectedPaid", { count }) : t("actions.markPaid")}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 space-y-6">
          <div>
            <label className="block text-sm text-gray-500">Payment Date</label>
            <input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>

          {invoiceId && (
            <div>
              <label className="block text-sm text-gray-500">Reference Number</label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g., Bank reference"
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-500">Notes</label>
            <textarea
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>

          {(markAsPaidMutation.isError || markPaidBatchMutation.isError) && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {markAsPaidMutation.error?.message ?? markPaidBatchMutation.error?.message}
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Processing..." : "Mark as Paid"}
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            {tCommon("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
