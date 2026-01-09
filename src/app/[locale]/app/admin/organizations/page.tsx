"use client";

import { useState } from "react";
import { Building2, AlertTriangle, Search, ExternalLink } from "lucide-react";
import { api } from "~/trpc/react";

export default function AdminOrganizationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "overdue" | "current">("all");

  const { data: organizations, isLoading } =
    api.platformBilling.getAllOrganizations.useQuery();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("fr-CH");
  };

  // Filter organizations
  const filteredOrgs = organizations?.filter((org) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.city?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter === "overdue") {
      matchesStatus = org.overdueCount > 0;
    } else if (statusFilter === "current") {
      matchesStatus = org.overdueCount === 0;
    }

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-light tracking-tight text-gray-900">
            Organizations
          </h1>
          <p className="mt-2 text-gray-500">Manage all CEL organizations</p>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
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
          Organizations
        </h1>
        <p className="mt-2 text-gray-500">
          {organizations?.length ?? 0} organizations registered
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-sm focus:border-pelorous-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
              statusFilter === "all"
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("current")}
            className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
              statusFilter === "current"
                ? "bg-emerald-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Current
          </button>
          <button
            onClick={() => setStatusFilter("overdue")}
            className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
              statusFilter === "overdue"
                ? "bg-red-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Overdue
          </button>
        </div>
      </div>

      {/* Organizations List */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Organization
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Location
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Invoices
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Total Paid
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Outstanding
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrgs?.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Building2 className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{org.name}</p>
                      <p className="text-sm text-gray-500">/{org.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {org.city ?? "-"}
                </td>
                <td className="px-6 py-4 text-right text-sm text-gray-600">
                  {org.invoiceCount}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {formatCurrency(org.totalPaid)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  {org.totalOutstanding > 0 ? (
                    <span className="text-amber-600">
                      {formatCurrency(org.totalOutstanding)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {org.overdueCount > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      {org.overdueCount} overdue
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs text-emerald-600">
                      Current
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrgs?.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">No organizations found</p>
          </div>
        )}
      </div>
    </div>
  );
}
