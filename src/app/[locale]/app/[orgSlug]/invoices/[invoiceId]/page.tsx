"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, Send, Check, FileText, Download, Loader2 } from "lucide-react";

export default function InvoiceDetailPage() {
  const params = useParams<{ orgSlug: string; invoiceId: string }>();
  const router = useRouter();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: invoice, refetch, isLoading } = api.invoice.getById.useQuery({
    invoiceId: params.invoiceId,
  });

  const updateStatusMutation = api.invoice.updateStatus.useMutation({
    onSuccess: () => refetch(),
  });

  const handleDownloadPdf = async () => {
    if (!invoice) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`);
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    } finally {
      setIsDownloading(false);
    }
  };

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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href={`/app/${params.orgSlug}/invoices`}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-light tracking-tight text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="mt-2 text-gray-400">
              {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span
            className={`rounded-lg px-4 py-1.5 text-sm ${
              invoice.status === "paid"
                ? "bg-emerald-50 text-emerald-600"
                : invoice.status === "sent"
                  ? "bg-pelorous-50 text-pelorous-600"
                  : invoice.status === "overdue"
                    ? "bg-red-50 text-red-500"
                    : "bg-gray-50 text-gray-500"
            }`}
          >
            {t(`status.${invoice.status}`)}
          </span>
          {invoice.status === "draft" && (
            <button
              onClick={handleMarkSent}
              disabled={updateStatusMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-pelorous-500 px-5 py-2.5 text-sm text-white hover:bg-pelorous-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {t("actions.send")}
            </button>
          )}
          {invoice.status === "sent" && (
            <button
              onClick={handleMarkPaid}
              disabled={updateStatusMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {t("actions.markPaid")}
            </button>
          )}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            PDF
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        {/* From/To */}
        <div className="grid gap-8 border-b border-gray-100 p-8 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">From</p>
            <p className="mt-3 text-sm font-medium text-gray-900">
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
              <p className="mt-3 text-sm text-gray-400">
                {invoice.organization.contactEmail}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">To</p>
            <p className="mt-3 text-sm font-medium text-gray-900">{invoice.member.name}</p>
            {invoice.member.address && (
              <p className="text-sm text-gray-500">{invoice.member.address}</p>
            )}
            {(invoice.member.postalCode || invoice.member.city) && (
              <p className="text-sm text-gray-500">
                {invoice.member.postalCode} {invoice.member.city}
              </p>
            )}
            <p className="mt-3 text-sm text-gray-400">{invoice.member.email}</p>
            <p className="mt-1 text-xs text-gray-400">POD: {invoice.member.podNumber}</p>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="border-b border-gray-100 p-8">
          <div className="grid gap-6 text-sm sm:grid-cols-3">
            <div>
              <p className="text-gray-400">Invoice Number</p>
              <p className="mt-1 font-mono text-gray-900">
                {invoice.invoiceNumber}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Issue Date</p>
              <p className="mt-1 text-gray-900">
                {formatDate(invoice.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Due Date</p>
              <p className="mt-1 text-gray-900">{formatDate(invoice.dueDate)}</p>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="p-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-left text-sm font-normal text-gray-400">
                  Description
                </th>
                <th className="pb-4 text-right text-sm font-normal text-gray-400">
                  Quantity
                </th>
                <th className="pb-4 text-right text-sm font-normal text-gray-400">
                  Unit Price
                </th>
                <th className="pb-4 text-right text-sm font-normal text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-4 text-sm text-gray-900">{line.description}</td>
                  <td className="py-4 text-right text-sm text-gray-500">
                    {line.quantity.toFixed(2)} {line.unit}
                  </td>
                  <td className="py-4 text-right text-sm text-gray-500">
                    {formatCurrency(line.unitPriceChf)}
                  </td>
                  <td
                    className={`py-4 text-right text-sm font-medium ${
                      line.lineType === "production_credit"
                        ? "text-emerald-600"
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
        <div className="border-t border-gray-100 bg-gray-50/50 p-8">
          <div className="ml-auto max-w-xs space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{tCommon("subtotal")}</span>
              <span className="text-gray-900">{formatCurrency(invoice.subtotalChf)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{tCommon("vat")} (7.7%)</span>
              <span className="text-gray-900">{formatCurrency(invoice.vatAmountChf)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-4 text-lg">
              <span className="text-gray-900">{tCommon("total")}</span>
              <span className="font-medium text-gray-900">{formatCurrency(invoice.totalChf)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status History */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <h2 className="text-lg font-light text-gray-900">Status History</h2>
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="text-gray-400">Created</span>
            <span className="text-gray-900">{formatDate(invoice.createdAt)}</span>
          </div>
          {invoice.sentAt && (
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2.5 w-2.5 rounded-full bg-pelorous-500" />
              <span className="text-gray-400">Sent</span>
              <span className="text-gray-900">{formatDate(invoice.sentAt)}</span>
            </div>
          )}
          {invoice.paidAt && (
            <div className="flex items-center gap-4 text-sm">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-gray-400">Paid</span>
              <span className="text-gray-900">{formatDate(invoice.paidAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
