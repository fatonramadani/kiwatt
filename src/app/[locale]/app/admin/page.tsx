"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import {
  Building2,
  Receipt,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { api } from "~/trpc/react";

export default function AdminDashboard() {
  const locale = useLocale();

  const { data: overview, isLoading: overviewLoading } =
    api.platformBilling.getRevenueOverview.useQuery();
  const { data: organizations, isLoading: orgsLoading } =
    api.platformBilling.getAllOrganizations.useQuery();
  const { data: invoicesData, isLoading: invoicesLoading } =
    api.platformBilling.getAllPlatformInvoices.useQuery({ limit: 5 });

  const isLoading = overviewLoading || orgsLoading || invoicesLoading;

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

  // Get organizations with overdue invoices
  const overdueOrgs = organizations?.filter((org) => org.overdueCount > 0) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-500">Platform overview and billing management</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light tracking-tight text-gray-900">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-gray-500">Platform overview and billing management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pelorous-50">
              <Building2 className="h-6 w-6 text-pelorous-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Organizations</p>
              <p className="text-2xl font-light text-gray-900">
                {overview?.organizationCount ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-light text-gray-900">
                {formatCurrency(overview?.totalRevenue ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Outstanding</p>
              <p className="text-2xl font-light text-gray-900">
                {formatCurrency(overview?.totalOutstanding ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-light text-gray-900">
                {overview?.overdueCount ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Recent Invoices */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
            <Link
              href={`/${locale}/app/admin/invoices`}
              className="flex items-center gap-1 text-sm text-pelorous-600 hover:text-pelorous-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {invoicesData?.invoices && invoicesData.invoices.length > 0 ? (
            <div className="space-y-4">
              {invoicesData.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50">
                      <Receipt className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {invoice.organization.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs ${getStatusColor(invoice.status)}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 p-8 text-center">
              <Receipt className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No invoices yet</p>
            </div>
          )}
        </div>

        {/* Organizations with Overdue */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">
              Attention Required
            </h2>
            <Link
              href={`/${locale}/app/admin/organizations`}
              className="flex items-center gap-1 text-sm text-pelorous-600 hover:text-pelorous-700"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {overdueOrgs.length > 0 ? (
            <div className="space-y-4">
              {overdueOrgs.slice(0, 5).map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-500">{org.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-red-600">
                      {formatCurrency(org.totalOutstanding)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {org.overdueCount} overdue invoice
                      {org.overdueCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-50 p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="mt-3 text-sm text-emerald-700">
                All organizations are up to date!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Platform Pricing
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Rate per kWh</p>
            <p className="mt-1 text-xl font-medium text-gray-900">
              CHF {overview?.ratePerKwh?.toFixed(3) ?? "0.005"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Minimum per month</p>
            <p className="mt-1 text-xl font-medium text-gray-900">
              CHF {overview?.minimumMonthly ?? 49}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">VAT Rate</p>
            <p className="mt-1 text-xl font-medium text-gray-900">
              {overview?.vatRate ?? 0}%
              {overview?.vatRate === 0 && (
                <span className="ml-2 text-sm text-gray-400">(not registered)</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
