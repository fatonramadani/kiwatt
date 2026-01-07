"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Settings, CreditCard, Tag, Share2, Check, Plus, Trash2 } from "lucide-react";

type TabId = "general" | "billing" | "tariffs" | "distribution";

export default function SettingsPage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
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
        <p className="mt-3 text-gray-400">Configure your community settings</p>
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
          {activeTab === "tariffs" && org && <TariffsTab orgId={org.id} />}
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
  org: any;
  onUpdate: () => void;
}) {
  const t = useTranslations("settings.organization");
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
  });

  const updateMutation = api.organization.update.useMutation({
    onSuccess: () => onUpdate(),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ orgId: org.id, ...formData });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8">
      <h2 className="text-xl font-light text-gray-900">{t("title")}</h2>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-500">{t("name")}</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("address")}</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("postalCode")}</label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("city")}</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("commune")}</label>
            <input
              type="text"
              value={formData.commune}
              onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">{t("canton")}</label>
            <input
              type="text"
              value={formData.canton}
              onChange={(e) => setFormData({ ...formData, canton: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
            />
          </div>
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
  );
}

// Billing Tab
function BillingTab({
  org,
  onUpdate,
}: {
  org: any;
  onUpdate: () => void;
}) {
  const t = useTranslations("settings.billing");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState({
    vatRate: org.billingSettings?.vatRate ?? 7.7,
    paymentTermDays: org.billingSettings?.paymentTermDays ?? 30,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ orgId: org.id, ...formData });
  };

  // Check if QR-bill is properly configured
  const qrBillConfigured = formData.iban && formData.payeeName && formData.payeeZip && formData.payeeCity;

  return (
    <div className="space-y-8">
      {/* Billing Settings */}
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

          {/* QR-bill Payment Information */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Swiss QR-bill</h3>
                <p className="mt-1 text-xs text-gray-400">
                  Configure payment information for invoices with QR code
                </p>
              </div>
              {qrBillConfigured ? (
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-600">
                  Configured
                </span>
              ) : (
                <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-600">
                  Not configured
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-500">IBAN</label>
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
                  QR-IBAN <span className="text-gray-300">(optional)</span>
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
                <label className="block text-sm text-gray-500">Payee Name</label>
                <input
                  type="text"
                  placeholder="My Energy Community"
                  value={formData.payeeName}
                  onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-gray-500">Payee Address</label>
                <input
                  type="text"
                  placeholder="Rue de l'Energie 1"
                  value={formData.payeeAddress}
                  onChange={(e) => setFormData({ ...formData, payeeAddress: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">ZIP Code</label>
                <input
                  type="text"
                  placeholder="1700"
                  value={formData.payeeZip}
                  onChange={(e) => setFormData({ ...formData, payeeZip: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-100 px-4 py-3 text-sm focus:border-gray-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500">City</label>
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
function TariffsTab({ orgId }: { orgId: string }) {
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
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingId(null);
            refetch();
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
                    title="Set as default"
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
                    if (confirm("Delete this tariff?")) {
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
            <p className="text-sm text-gray-400">No tariffs configured yet</p>
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
  onClose,
  onSuccess,
}: {
  orgId: string;
  tariffId: string | null;
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
    vatRate: 7.7,
    validFrom: new Date().toISOString().split("T")[0] ?? "",
    validTo: "",
    isDefault: false,
  });

  // Update form when editing existing tariff
  useState(() => {
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
  });

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
  org: any;
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
      distributionStrategy: selected as "prorata" | "equal" | "priority",
    });
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-8">
      <h2 className="text-lg font-light text-gray-900">{t("title")}</h2>
      <p className="mt-2 text-sm text-gray-400">
        Choose how excess solar production is distributed among members
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
