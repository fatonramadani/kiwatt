"use client";

import { useState } from "react";
import {
  Receipt,
  Search,
  Plus,
  Send,
  CheckCircle,
  Download,
  X,
} from "lucide-react";
import { api } from "~/trpc/react";

export default function AdminInvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "sent" | "paid"
  >("all");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const utils = api.useUtils();

  const { data: invoicesData, isLoading } =
    api.platformBilling.getAllPlatformInvoices.useQuery({
      limit: 100,
      status: statusFilter === "all" ? undefined : statusFilter,
    });

  const { data: organizations } =
    api.platformBilling.getAllOrganizations.useQuery();

  const generateMutation = api.platformBilling.adminGenerateInvoice.useMutation(
    {
      onSuccess: () => {
        void utils.platformBilling.getAllPlatformInvoices.invalidate();
        void utils.platformBilling.getRevenueOverview.invalidate();
        setShowGenerateModal(false);
        setSelectedOrgId("");
      },
    }
  );

  const markSentMutation = api.platformBilling.adminMarkAsSent.useMutation({
    onSuccess: () => {
      void utils.platformBilling.getAllPlatformInvoices.invalidate();
    },
  });

  const markPaidMutation = api.platformBilling.adminMarkAsPaid.useMutation({
    onSuccess: () => {
      void utils.platformBilling.getAllPlatformInvoices.invalidate();
      void utils.platformBilling.getRevenueOverview.invalidate();
    },
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-CH");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-600";
      case "sent":
        return "bg-amber-50 text-amber-600";
      case "draft":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Filter invoices by search
  const filteredInvoices = invoicesData?.invoices.filter((inv) => {
    if (!searchQuery) return true;
    return (
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.organization.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">
            Platform Invoices
          </h1>
          <p className="mt-2 text-gray-500">Manage platform billing invoices</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">
            Platform Invoices
          </h1>
          <p className="mt-2 text-gray-500">
            {invoicesData?.total ?? 0} total invoices
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Generate Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-pelorous-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "draft", "sent", "paid"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-4 py-2.5 text-sm capitalize transition-colors ${
                statusFilter === status
                  ? "bg-gray-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Invoice
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Organization
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Period
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                kWh
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Due Date
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInvoices?.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                      <Receipt className="h-4 w-4 text-gray-500" />
                    </div>
                    <span className="font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {invoice.organization.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {monthNames[invoice.month - 1]} {invoice.year}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-600">
                  {invoice.totalKwhManaged.toFixed(0)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(invoice.totalAmount)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(invoice.dueDate)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex rounded-lg px-2.5 py-1 text-xs ${getStatusColor(invoice.status)}`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {invoice.status === "draft" && (
                      <button
                        onClick={() =>
                          markSentMutation.mutate({ invoiceId: invoice.id })
                        }
                        disabled={markSentMutation.isPending}
                        className="rounded-lg p-2 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                        title="Mark as sent"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    {invoice.status === "sent" && (
                      <button
                        onClick={() =>
                          markPaidMutation.mutate({ invoiceId: invoice.id })
                        }
                        disabled={markPaidMutation.isPending}
                        className="rounded-lg p-2 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600"
                        title="Mark as paid"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    <a
                      href={`/api/platform-invoices/${invoice.id}/pdf`}
                      download
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Download PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInvoices?.length === 0 && (
          <div className="p-12 text-center">
            <Receipt className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No invoices found</p>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-gray-900">
                Generate Invoice
              </h2>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Organization
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pelorous-500 focus:outline-none"
                >
                  <option value="">Select organization...</option>
                  {organizations?.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pelorous-500 focus:outline-none"
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-pelorous-500 focus:outline-none"
                  >
                    {monthNames.map((name, i) => (
                      <option key={i + 1} value={i + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {generateMutation.error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {generateMutation.error.message}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedOrgId) {
                      generateMutation.mutate({
                        orgId: selectedOrgId,
                        year: selectedYear,
                        month: selectedMonth,
                      });
                    }
                  }}
                  disabled={!selectedOrgId || generateMutation.isPending}
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {generateMutation.isPending ? "Generating..." : "Generate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
