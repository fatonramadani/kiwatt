"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Settings, CreditCard, Tag, Share2, Check, Plus, Trash2, Receipt, Download, ExternalLink } from "lucide-react";
import { AddressAutocomplete, type AddressData } from "~/components/app/address-autocomplete";
import { PricingGuide } from "~/components/app/pricing-guide";
import { cn } from "~/lib/utils";

type TabId = "general" | "billing" | "tariffs" | "distribution";

// Organization data type from API
interface OrganizationData {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  commune: string | null;
  canton: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  timbreReduction: "20" | "40" | null;
  distributionStrategy: "prorata" | "equal" | "priority" | null;
  billingSettings?: {
    currency?: string;
    vatRate: number;
    paymentTermDays: number;
    vatNumber?: string;
    uid?: string;
    iban?: string;
    qrIban?: string;
    payeeName?: string;
    payeeAddress?: string;
    payeeZip?: string;
    payeeCity?: string;
    payeeCountry?: string;
  } | null;
}

export default function SettingsPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("settings");
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const { data: org, refetch: refetchOrg } = api.organization.getBySlug.useQuery({
    slug: params.orgSlug,
  });

  const tabs = [
    { id: "general" as const, label: t("tabs.general"), icon: Settings },
    { id: "billing" as const, label: t("tabs.billing"), icon: CreditCard },
    { id: "tariffs" as const, label: t("tabs.tariffs"), icon: Tag },
    { id: "distribution" as const, label: t("tabs.distribution"), icon: Share2 },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-gray-900">{t("title")}</h1>
        <p className="mt-3 text-gray-400">{t("description")}</p>
      </div>

      <div className="flex gap-10">
        {/* Sidebar tabs */}
        <div className="w-56 shrink-0">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-50 text-gray-900"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? "text-pelorous-500" : "text-gray-400"}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === "general" && org && (
            <GeneralTab org={org} onUpdate={refetchOrg} />
          )}
          {activeTab === "billing" && org && (
            <BillingTab org={org} onUpdate={refetchOrg} />
          )}
          {activeTab === "tariffs" && org && <TariffsTab orgId={org.id} timbreReduction={org.timbreReduction ?? "20"} />}
          {activeTab === "distribution" && org && (
            <DistributionTab org={org} onUpdate={refetchOrg} />
          )}
        </div>
      </div>
    </div>
  );
}

// General Tab
function GeneralTab({
  org,
  onUpdate,
}: {
  org: OrganizationData;
  onUpdate: () => void;
}) {
  const t = useTranslations("settings.organization");
  const tOrg = useTranslations("organizations.form");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState({
    name: org.name ?? "",
    address: org.address ?? "",
    postalCode: org.postalCode ?? "",
    city: org.city ?? "",
    commune: org.commune ?? "",
    canton: org.canton ?? "",
    contactEmail: org.contactEmail ?? "",
    contactPhone: org.contactPhone ?? "",
    timbreReduction: org.timbreReduction ?? "20",
  });

  const updateMutation = api.organization.update.useMutation({
    onSuccess: () => onUpdate(),
  });

  const handleAddressSelect = (addressData: AddressData) => {
    setFormData((prev) => ({
      ...prev,
      postalCode: addressData.postalCode,
      city: addressData.city,
      commune: addressData.commune ?? prev.commune,
      canton: addressData.canton ?? prev.canton,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ orgId: org.id, ...formData });
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <h2 className="text-xl font-light text-gray-900">{t("title")}</h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm text-gray-500">{t("name")}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="rounded-xl bg-gray-50 p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">{t("addressSection")}</h3>
            <div>
              <label className="block text-sm text-gray-500">{t("address")}</label>
              <AddressAutocomplete
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
                onAddressSelect={handleAddressSelect}
                className="mt-2"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-500">{t("postalCode")}</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">{t("city")}</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">{t("commune")}</label>
                <input
                  type="text"
                  value={formData.commune}
                  onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">{t("canton")}</label>
                <input
                  type="text"
                  value={formData.canton}
                  onChange={(e) => setFormData({ ...formData, canton: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-sm text-gray-500">{t("contactEmail")}</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("contactPhone")}</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Timbre Reduction Section */}
          <div className="border-t border-gray-100 pt-6 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">{tOrg("timbreReduction")}</label>
              <p className="mt-1 text-xs text-gray-400">{tOrg("timbreReductionHelp")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={cn(
                  "relative cursor-pointer rounded-xl border-2 p-4 transition-all",
                  formData.timbreReduction === "20"
                    ? "border-pelorous-500 bg-pelorous-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="timbreReduction"
                  value="20"
                  checked={formData.timbreReduction === "20"}
                  onChange={() => setFormData({ ...formData, timbreReduction: "20" })}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 h-4 w-4 rounded-full border-2",
                      formData.timbreReduction === "20"
                        ? "border-pelorous-500 bg-pelorous-500"
                        : "border-gray-300"
                    )}
                  >
                    {formData.timbreReduction === "20" && (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">20%</p>
                    <p className="text-sm text-gray-500">{tOrg("timbre20")}</p>
                  </div>
                </div>
              </label>
              <label
                className={cn(
                  "relative cursor-pointer rounded-xl border-2 p-4 transition-all",
                  formData.timbreReduction === "40"
                    ? "border-pelorous-500 bg-pelorous-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <input
                  type="radio"
                  name="timbreReduction"
                  value="40"
                  checked={formData.timbreReduction === "40"}
                  onChange={() => setFormData({ ...formData, timbreReduction: "40" })}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 h-4 w-4 rounded-full border-2",
                      formData.timbreReduction === "40"
                        ? "border-pelorous-500 bg-pelorous-500"
                        : "border-gray-300"
                    )}
                  >
                    {formData.timbreReduction === "40" && (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">40%</p>
                    <p className="text-sm text-gray-500">{tOrg("timbre40")}</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {updateMutation.isPending ? tCommon("loading") : tCommon("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Platform Subscription Section (Kiwatt billing)
function PlatformSubscriptionSection({ orgId }: { orgId: string }) {
  const t = useTranslations("settings.billing.subscription");
  const { data: summary, isLoading } = api.platformBilling.getBillingSummary.useQuery({ orgId });
  const { data: invoicesData } = api.platformBilling.getMyPlatformInvoices.useQuery({ orgId, limit: 5 });

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleDateString("fr-CH");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-600";
      case "sent":
        return "bg-amber-50 text-amber-600";
      default:
        return "bg-gray-50 text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-100 rounded"></div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-50 rounded-xl"></div>
            <div className="h-20 bg-gray-50 rounded-xl"></div>
            <div className="h-20 bg-gray-50 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-light text-gray-900">{t("title")}</h2>
          <p className="mt-1 text-sm text-gray-400">
            {t("description")}
          </p>
        </div>
        <div className="rounded-xl bg-pelorous-50 px-4 py-2">
          <span className="text-sm text-pelorous-600">
            CHF {summary?.ratePerKwh?.toFixed(3) ?? "0.005"}/kWh
          </span>
          <span className="mx-2 text-pelorous-300">|</span>
          <span className="text-sm text-pelorous-600">
            min. CHF {summary?.minimumMonthly ?? 49}/mo
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-400">{t("totalPaid")}</p>
          <p className="mt-1 text-xl font-light text-gray-900">
            CHF {(summary?.totalPaid ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-400">{t("outstanding")}</p>
          <p className="mt-1 text-xl font-light text-gray-900">
            CHF {(summary?.totalOutstanding ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs text-gray-400">{t("totalInvoices")}</p>
          <p className="mt-1 text-xl font-light text-gray-900">
            {summary?.invoiceCount ?? 0}
          </p>
        </div>
      </div>

      {/* Recent Invoices */}
      {invoicesData && invoicesData.invoices.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-900">{t("recentInvoices")}</h3>
          <div className="mt-4 space-y-3">
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
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-400">
                      {monthNames[invoice.month]} {invoice.year} • {invoice.totalKwhManaged.toFixed(0)} kWh
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      CHF {invoice.totalAmount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t("due", { date: formatDate(invoice.dueDate) })}
                    </p>
                  </div>
                  <span className={`rounded-lg px-2.5 py-1 text-xs ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No invoices yet */}
      {(!invoicesData || invoicesData.invoices.length === 0) && (
        <div className="mt-8 rounded-xl bg-gray-50 p-6 text-center">
          <Receipt className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-400">
            {t("noInvoices")}
          </p>
        </div>
      )}

      {/* Info footer */}
      <div className="mt-6 rounded-xl bg-pelorous-50/50 p-4">
        <div className="flex items-start gap-3">
          <ExternalLink className="mt-0.5 h-4 w-4 text-pelorous-500" />
          <div>
            <p className="text-sm text-pelorous-700">
              {t("pricingInfo")}
            </p>
            <p className="mt-1 text-xs text-pelorous-600">
              {t("vatInfo", { rate: summary?.vatRate ?? 8.1 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Billing Tab
function BillingTab({
  org,
  onUpdate,
}: {
  org: OrganizationData;
  onUpdate: () => void;
}) {
  const t = useTranslations("settings.billing");
  const tQr = useTranslations("settings.billing.qrBill");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState({
    vatRate: org.billingSettings?.vatRate ?? 8.1,
    paymentTermDays: org.billingSettings?.paymentTermDays ?? 30,
    vatNumber: org.billingSettings?.vatNumber ?? "",
    uid: org.billingSettings?.uid ?? "",
    iban: org.billingSettings?.iban ?? "",
    qrIban: org.billingSettings?.qrIban ?? "",
    payeeName: org.billingSettings?.payeeName ?? "",
    payeeAddress: org.billingSettings?.payeeAddress ?? "",
    payeeZip: org.billingSettings?.payeeZip ?? "",
    payeeCity: org.billingSettings?.payeeCity ?? "",
  });

  const updateMutation = api.organization.updateBillingSettings.useMutation({
    onSuccess: () => onUpdate(),
  });

  const handlePayeeAddressSelect = (addressData: AddressData) => {
    setFormData((prev) => ({
      ...prev,
      payeeZip: addressData.postalCode,
      payeeCity: addressData.city,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ orgId: org.id, ...formData });
  };

  // Check if QR-bill is properly configured
  const qrBillConfigured = formData.iban && formData.payeeName && formData.payeeZip && formData.payeeCity;

  return (
    <div className="space-y-8">
      {/* Platform Subscription */}
      <PlatformSubscriptionSection orgId={org.id} />

      {/* Member Billing Settings */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-8">
        <h2 className="text-xl font-light text-gray-900">{t("title")}</h2>
        <div className="mt-8 space-y-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="block text-sm text-gray-500">{t("currency")}</label>
              <input
                type="text"
                value="CHF"
                disabled
                className="mt-2 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("vatRate")}</label>
              <input
                type="number"
                step="0.1"
                value={formData.vatRate}
                onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500">{t("paymentTerms")}</label>
              <input
                type="number"
                value={formData.paymentTermDays}
                onChange={(e) => setFormData({ ...formData, paymentTermDays: parseInt(e.target.value) })}
                className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Legal Identifiers */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-900">{t("legalIdentifiers")}</h3>
            <p className="mt-1 text-xs text-gray-400">
              {t("legalIdentifiersDescription")}
            </p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-gray-500">{t("uid")}</label>
                <input
                  type="text"
                  placeholder="CHE-123.456.789"
                  value={formData.uid}
                  onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 font-mono text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">{t("vatNumber")}</label>
                <input
                  type="text"
                  placeholder="CHE-123.456.789 MWST"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 font-mono text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* QR-bill Payment Information */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">{tQr("title")}</h3>
                <p className="mt-1 text-xs text-gray-400">
                  {tQr("description")}
                </p>
              </div>
              {qrBillConfigured ? (
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-600">
                  {tQr("configured")}
                </span>
              ) : (
                <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-600">
                  {tQr("notConfigured")}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-500">{tQr("iban")}</label>
                <input
                  type="text"
                  placeholder="CH93 0076 2011 6238 5295 7"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 font-mono text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-500">
                  {tQr("qrIban")} <span className="text-gray-300">({tQr("optional")})</span>
                </label>
                <input
                  type="text"
                  placeholder="CH44 3199 9123 0008 8901 2"
                  value={formData.qrIban}
                  onChange={(e) => setFormData({ ...formData, qrIban: e.target.value.toUpperCase() })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 font-mono text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-500">{tQr("payeeName")}</label>
                <input
                  type="text"
                  placeholder="My Energy Community"
                  value={formData.payeeName}
                  onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-500">{tQr("payeeAddress")}</label>
                <AddressAutocomplete
                  value={formData.payeeAddress}
                  onChange={(value) => setFormData({ ...formData, payeeAddress: value })}
                  onAddressSelect={handlePayeeAddressSelect}
                  className="mt-2"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">{tQr("zipCode")}</label>
                <input
                  type="text"
                  placeholder="1700"
                  value={formData.payeeZip}
                  onChange={(e) => setFormData({ ...formData, payeeZip: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">{tQr("city")}</label>
                <input
                  type="text"
                  placeholder="Fribourg"
                  value={formData.payeeCity}
                  onChange={(e) => setFormData({ ...formData, payeeCity: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {updateMutation.isPending ? tCommon("loading") : tCommon("save")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Tariffs Tab
function TariffsTab({ orgId, timbreReduction }: { orgId: string; timbreReduction: "20" | "40" }) {
  const t = useTranslations("settings.tariffs");
  const tCommon = useTranslations("common");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: tariffs, refetch } = api.tariff.list.useQuery({ orgId });
  const deleteMutation = api.tariff.delete.useMutation({
    onSuccess: () => refetch(),
  });
  const setDefaultMutation = api.tariff.setDefault.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-6">
      {/* Pricing Guide */}
      <PricingGuide timbreReduction={timbreReduction} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-light text-gray-900">{t("title")}</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm text-white hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          {t("add")}
        </button>
      </div>

      {showForm && (
        <TariffForm
          orgId={orgId}
          tariffId={editingId}
          timbreReduction={timbreReduction}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingId(null);
            void refetch();
          }}
        />
      )}

      <div className="space-y-4">
        {tariffs?.map((tariff) => (
          <div
            key={tariff.id}
            className="rounded-2xl border border-gray-100 bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-gray-900">{tariff.name}</h3>
                  {tariff.isDefault && (
                    <span className="rounded-lg bg-pelorous-50 px-2.5 py-1 text-xs text-pelorous-600">
                      {t("default")}
                    </span>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-6 text-sm">
                  <div>
                    <span className="block text-xs text-gray-400">{t("communityRate")}</span>
                    <span className="text-gray-900">{parseFloat(tariff.communityRateChfKwh).toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400">{t("gridRate")}</span>
                    <span className="text-gray-900">{parseFloat(tariff.gridRateChfKwh).toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400">{t("injectionRate")}</span>
                    <span className="text-gray-900">{parseFloat(tariff.injectionRateChfKwh).toFixed(4)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!tariff.isDefault && (
                  <button
                    onClick={() => setDefaultMutation.mutate({ tariffId: tariff.id })}
                    className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-pelorous-600"
                    title={t("setAsDefault")}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingId(tariff.id);
                    setShowForm(true);
                  }}
                  className="rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                >
                  {tCommon("edit")}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t("confirmDelete"))) {
                      deleteMutation.mutate({ tariffId: tariff.id });
                    }
                  }}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {(!tariffs || tariffs.length === 0) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
            <p className="text-sm text-gray-400">{t("noTariffs")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Tariff Form
function TariffForm({
  orgId,
  tariffId,
  timbreReduction: _timbreReduction,
  onClose,
  onSuccess,
}: {
  orgId: string;
  tariffId: string | null;
  timbreReduction: "20" | "40";
  onClose: () => void;
  onSuccess: () => void;
}) {
  const t = useTranslations("settings.tariffs");
  const tCommon = useTranslations("common");

  const { data: existingTariff } = api.tariff.getById.useQuery(
    { tariffId: tariffId! },
    { enabled: !!tariffId }
  );

  const [formData, setFormData] = useState({
    name: "",
    communityRateChfKwh: 0.15,
    gridRateChfKwh: 0.25,
    injectionRateChfKwh: 0.08,
    monthlyFeeChf: 0,
    vatRate: 8.1,
    validFrom: new Date().toISOString().split("T")[0] ?? "",
    validTo: "",
    isDefault: false,
  });

  // Update form when editing existing tariff
  useEffect(() => {
    if (existingTariff) {
      setFormData({
        name: existingTariff.name,
        communityRateChfKwh: parseFloat(existingTariff.communityRateChfKwh),
        gridRateChfKwh: parseFloat(existingTariff.gridRateChfKwh),
        injectionRateChfKwh: parseFloat(existingTariff.injectionRateChfKwh),
        monthlyFeeChf: parseFloat(existingTariff.monthlyFeeChf ?? "0"),
        vatRate: parseFloat(existingTariff.vatRate),
        validFrom: existingTariff.validFrom.toISOString().split("T")[0] ?? "",
        validTo: existingTariff.validTo?.toISOString().split("T")[0] ?? "",
        isDefault: existingTariff.isDefault,
      });
    }
  }, [existingTariff]);

  const createMutation = api.tariff.create.useMutation({ onSuccess });
  const updateMutation = api.tariff.update.useMutation({ onSuccess });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tariffId) {
      updateMutation.mutate({
        tariffId,
        name: formData.name,
        communityRateChfKwh: formData.communityRateChfKwh,
        gridRateChfKwh: formData.gridRateChfKwh,
        injectionRateChfKwh: formData.injectionRateChfKwh,
        monthlyFeeChf: formData.monthlyFeeChf,
        vatRate: formData.vatRate,
        validFrom: new Date(formData.validFrom || new Date()),
        validTo: formData.validTo ? new Date(formData.validTo) : null,
      });
    } else {
      createMutation.mutate({
        orgId,
        name: formData.name,
        communityRateChfKwh: formData.communityRateChfKwh,
        gridRateChfKwh: formData.gridRateChfKwh,
        injectionRateChfKwh: formData.injectionRateChfKwh,
        monthlyFeeChf: formData.monthlyFeeChf,
        vatRate: formData.vatRate,
        validFrom: new Date(formData.validFrom || new Date()),
        validTo: formData.validTo ? new Date(formData.validTo) : undefined,
        isDefault: formData.isDefault,
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-500">{t("name")}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("communityRate")}</label>
            <input
              type="number"
              step="0.0001"
              value={formData.communityRateChfKwh}
              onChange={(e) => setFormData({ ...formData, communityRateChfKwh: parseFloat(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("gridRate")}</label>
            <input
              type="number"
              step="0.0001"
              value={formData.gridRateChfKwh}
              onChange={(e) => setFormData({ ...formData, gridRateChfKwh: parseFloat(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("injectionRate")}</label>
            <input
              type="number"
              step="0.0001"
              value={formData.injectionRateChfKwh}
              onChange={(e) => setFormData({ ...formData, injectionRateChfKwh: parseFloat(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("monthlyFee")}</label>
            <input
              type="number"
              step="0.01"
              value={formData.monthlyFeeChf}
              onChange={(e) => setFormData({ ...formData, monthlyFeeChf: parseFloat(e.target.value) })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("validFrom")}</label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("validTo")}</label>
            <input
              type="date"
              value={formData.validTo}
              onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>
          {!tariffId && (
            <div className="sm:col-span-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-pelorous-600"
                />
                <span className="text-sm text-gray-500">{t("default")}</span>
              </label>
            </div>
          )}
        </div>
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {isPending ? tCommon("loading") : tCommon("save")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-6 py-3 text-sm text-gray-500 hover:bg-gray-50"
          >
            {tCommon("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}

// Distribution Tab
function DistributionTab({
  org,
  onUpdate,
}: {
  org: OrganizationData;
  onUpdate: () => void;
}) {
  const t = useTranslations("energy.distribution");
  const tCommon = useTranslations("common");
  const [selected, setSelected] = useState(org.distributionStrategy ?? "prorata");

  const updateMutation = api.organization.update.useMutation({
    onSuccess: () => onUpdate(),
  });

  const strategies = [
    { id: "prorata", label: t("prorata"), description: t("prorataDesc") },
    { id: "equal", label: t("equal"), description: t("equalDesc") },
    { id: "priority", label: t("priority"), description: t("priorityDesc") },
  ] as const;

  const handleSave = () => {
    updateMutation.mutate({
      orgId: org.id,
      distributionStrategy: selected,
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8">
      <h2 className="text-lg font-light text-gray-900">{t("title")}</h2>
      <p className="mt-2 text-sm text-gray-400">
        {t("description")}
      </p>
      <div className="mt-8 space-y-4">
        {strategies.map((strategy) => (
          <label
            key={strategy.id}
            className={`block cursor-pointer rounded-xl border p-5 transition-colors ${
              selected === strategy.id
                ? "border-pelorous-200 bg-pelorous-50/50"
                : "border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
            }`}
          >
            <div className="flex items-start gap-4">
              <input
                type="radio"
                name="distribution"
                value={strategy.id}
                checked={selected === strategy.id}
                onChange={() => setSelected(strategy.id)}
                className="mt-1 h-4 w-4 border-gray-300 text-pelorous-600"
              />
              <div>
                <p className="font-medium text-gray-900">{strategy.label}</p>
                <p className="mt-1 text-sm text-gray-500">{strategy.description}</p>
              </div>
            </div>
          </label>
        ))}
      </div>
      <div className="pt-8">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="rounded-xl bg-gray-900 px-6 py-3 text-sm text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {updateMutation.isPending ? tCommon("loading") : tCommon("save")}
        </button>
      </div>
    </div>
  );
}
