"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, Send, Check, FileText, Download } from "lucide-react";

export default function InvoiceDetailPage() {
  const params = useParams<{ orgSlug: string; invoiceId: string }>();
  const router = useRouter();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const { data: invoice, refetch, isLoading } = api.invoice.getById.useQuery({
    invoiceId: params.invoiceId,
  });

  const updateStatusMutation = api.invoice.updateStatus.useMutation({
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

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">{tCommon("loading")}</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <FileText className="h-12 w-12 text-gray-300" />
        <p className="mt-4 text-gray-500">Invoice not found</p>
        <Link
          href={`/app/${params.orgSlug}/invoices`}
          className="mt-4 text-sm text-gray-900 underline"
        >
          Back to invoices
        </Link>
      </div>
    );
  }

  const handleMarkSent = () => {
    updateStatusMutation.mutate({ invoiceId: invoice.id, status: "sent" });
  };

  const handleMarkPaid = () => {
    updateStatusMutation.mutate({ invoiceId: invoice.id, status: "paid" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/app/${params.orgSlug}/invoices`}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-normal text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-gray-500">
              {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded px-3 py-1 text-sm ${
              invoice.status === "paid"
                ? "bg-green-50 text-green-700"
                : invoice.status === "sent"
                  ? "bg-blue-50 text-blue-700"
                  : invoice.status === "overdue"
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-100 text-gray-600"
            }`}
          >
            {t(`status.${invoice.status}`)}
          </span>
          {invoice.status === "draft" && (
            <button
              onClick={handleMarkSent}
              disabled={updateStatusMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {t("actions.send")}
            </button>
          )}
          {invoice.status === "sent" && (
            <button
              onClick={handleMarkPaid}
              disabled={updateStatusMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {t("actions.markPaid")}
            </button>
          )}
          <button
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {/* From/To */}
        <div className="grid gap-6 border-b border-gray-200 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">From</p>
            <p className="mt-2 text-sm font-medium text-gray-900">
              {invoice.organization.name}
            </p>
            {invoice.organization.address && (
              <p className="text-sm text-gray-500">{invoice.organization.address}</p>
            )}
            {(invoice.organization.postalCode || invoice.organization.city) && (
              <p className="text-sm text-gray-500">
                {invoice.organization.postalCode} {invoice.organization.city}
              </p>
            )}
            {invoice.organization.contactEmail && (
              <p className="mt-2 text-sm text-gray-500">
                {invoice.organization.contactEmail}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">To</p>
            <p className="mt-2 text-sm font-medium text-gray-900">{invoice.member.name}</p>
            {invoice.member.address && (
              <p className="text-sm text-gray-500">{invoice.member.address}</p>
            )}
            {(invoice.member.postalCode || invoice.member.city) && (
              <p className="text-sm text-gray-500">
                {invoice.member.postalCode} {invoice.member.city}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">{invoice.member.email}</p>
            <p className="text-xs text-gray-400">POD: {invoice.member.podNumber}</p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="border-b border-gray-200 p-6">
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-gray-500">Invoice Number</p>
              <p className="font-mono font-medium text-gray-900">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Issue Date</p>
              <p className="font-medium text-gray-900">
                {formatDate(invoice.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Due Date</p>
              <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 text-left text-sm font-medium text-gray-500">
                  Description
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-500">
                  Quantity
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-500">
                  Unit Price
                </th>
                <th className="pb-3 text-right text-sm font-medium text-gray-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 text-sm text-gray-900">{line.description}</td>
                  <td className="py-3 text-right text-sm text-gray-500">
                    {line.quantity.toFixed(2)} {line.unit}
                  </td>
                  <td className="py-3 text-right text-sm text-gray-500">
                    {formatCurrency(line.unitPriceChf)}
                  </td>
                  <td
                    className={`py-3 text-right text-sm font-medium ${
                      line.lineType === "production_credit"
                        ? "text-green-600"
                        : "text-gray-900"
                    }`}
                  >
                    {line.lineType === "production_credit" ? "-" : ""}
                    {formatCurrency(Math.abs(line.totalChf))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{tCommon("subtotal")}</span>
              <span className="text-gray-900">{formatCurrency(invoice.subtotalChf)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{tCommon("vat")} (7.7%)</span>
              <span className="text-gray-900">{formatCurrency(invoice.vatAmountChf)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-medium">
              <span className="text-gray-900">{tCommon("total")}</span>
              <span className="text-gray-900">{formatCurrency(invoice.totalChf)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status History */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-base font-medium text-gray-900">Status History</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="h-2 w-2 rounded-full bg-gray-300" />
            <span className="text-gray-500">Created</span>
            <span className="text-gray-900">{formatDate(invoice.createdAt)}</span>
          </div>
          {invoice.sentAt && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-gray-500">Sent</span>
              <span className="text-gray-900">{formatDate(invoice.sentAt)}</span>
            </div>
          )}
          {invoice.paidAt && (
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-gray-500">Paid</span>
              <span className="text-gray-900">{formatDate(invoice.paidAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
