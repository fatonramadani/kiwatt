"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { FileText, Download, ExternalLink } from "lucide-react";

export default function PortalInvoicesPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("portal");

  const { data: memberData } = api.member.getMyMembership.useQuery({
    orgSlug: params.orgSlug,
  });

  const { data: invoicesData, isLoading } = api.member.getMyInvoices.useQuery(
    { orgId: memberData?.organization.id ?? "" },
    { enabled: !!memberData?.organization.id }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-CH");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-600";
      case "sent":
        return "bg-pelorous-50 text-pelorous-600";
      case "overdue":
        return "bg-red-50 text-red-500";
      case "draft":
        return "bg-gray-50 text-gray-500";
      default:
        return "bg-gray-50 text-gray-400";
    }
  };

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
          {t("myInvoices")}
        </h1>
        <p className="mt-3 text-gray-400">{t("invoicesSubtitle")}</p>
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl border border-gray-100 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("invoiceNumber")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("period")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("amount")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("statusLabel")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-normal text-gray-400">
                {t("dueDate")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-normal text-gray-400">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {invoicesData?.invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-gray-200" />
                  <p className="mt-4 text-sm text-gray-400">{t("noInvoices")}</p>
                </td>
              </tr>
            ) : (
              invoicesData?.invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-gray-50 last:border-0"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">
                      {invoice.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(invoice.totalChf)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-1 text-xs ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {t(`status.${invoice.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(invoice.dueDate)}
                    {invoice.paidAt && (
                      <span className="ml-2 text-xs text-emerald-600">
                        ({t("paidOn")} {formatDate(invoice.paidAt)})
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.pdfUrl && (
                        <>
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            title={t("view")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                          <a
                            href={invoice.pdfUrl}
                            download={`facture-${invoice.invoiceNumber}.pdf`}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-pelorous-600"
                            title={t("download")}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </>
                      )}
                      {!invoice.pdfUrl && (
                        <a
                          href={`/api/invoices/${invoice.id}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-pelorous-600"
                          title={t("download")}
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {invoicesData && invoicesData.total > 0 && (
        <div className="text-sm text-gray-400">
          {invoicesData.total} {t("invoiceCount")}
        </div>
      )}
    </div>
  );
}
