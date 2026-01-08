"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import { ArrowLeft, Info, Loader2 } from "lucide-react";
import {
  AddressAutocomplete,
  type AddressData,
} from "~/components/app/address-autocomplete";
import { cn } from "~/lib/utils";

export default function NewOrganizationPage() {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [commune, setCommune] = useState("");
  const [canton, setCanton] = useState("");
  const [timbreReduction, setTimbreReduction] = useState<"20" | "40">("20");
  const [error, setError] = useState("");

  const utils = api.useUtils();
  const createOrg = api.organization.create.useMutation({
    onSuccess: (data) => {
      void utils.organization.list.invalidate();
      router.push(`/app/${data.slug}/dashboard`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
    setSlug(generatedSlug);
  };

  const handleAddressSelect = (addressData: AddressData) => {
    setPostalCode(addressData.postalCode);
    setCity(addressData.city);
    if (addressData.commune) setCommune(addressData.commune);
    if (addressData.canton) setCanton(addressData.canton);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(tValidation("required"));
      return;
    }

    if (!slug.trim()) {
      setError(tValidation("required"));
      return;
    }

    createOrg.mutate({
      name: name.trim(),
      slug: slug.trim(),
      address: address.trim() || undefined,
      postalCode: postalCode.trim() || undefined,
      city: city.trim() || undefined,
      commune: commune.trim() || undefined,
      canton: canton.trim() || undefined,
      timbreReduction,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        {/* Back link */}
        <div className="mb-10">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("back")}
          </Link>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8 sm:p-10">
          {/* Title */}
          <div className="mb-10">
            <h1 className="text-2xl font-light tracking-tight text-gray-900 sm:text-3xl">
              {t("create")}
            </h1>
            <p className="mt-3 text-gray-400">{t("createDescription")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Name field */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                {t("form.name")}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="CEL Commune de Lausanne"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-pelorous-300 focus:outline-none focus:ring-2 focus:ring-pelorous-100"
              />
            </div>

            {/* Slug field */}
            <div className="space-y-2">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700"
              >
                {t("form.slug")}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">kiwatt.ch/app/</span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "")
                        .slice(0, 50)
                    )
                  }
                  placeholder="cel-lausanne"
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-pelorous-300 focus:outline-none focus:ring-2 focus:ring-pelorous-100"
                />
              </div>
              <p className="text-xs text-gray-400">{t("form.slugHelp")}</p>
            </div>

            {/* Address Section */}
            <div className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
              <h3 className="text-sm font-medium text-gray-700">
                {t("form.addressSection")}
              </h3>

              <div className="space-y-2">
                <label className="block text-sm text-gray-600">
                  {t("form.address")}
                </label>
                <AddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  onAddressSelect={handleAddressSelect}
                  className="rounded-xl border-gray-200 focus:border-pelorous-300"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="postalCode"
                    className="block text-sm text-gray-600"
                  >
                    {t("form.postalCode")}
                  </label>
                  <input
                    id="postalCode"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="1003"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-pelorous-300 focus:outline-none focus:ring-2 focus:ring-pelorous-100"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm text-gray-600">
                    {t("form.city")}
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lausanne"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-pelorous-300 focus:outline-none focus:ring-2 focus:ring-pelorous-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="commune"
                    className="block text-sm text-gray-600"
                  >
                    {t("form.commune")}
                  </label>
                  <input
                    id="commune"
                    type="text"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="Lausanne"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-pelorous-300 focus:outline-none focus:ring-2 focus:ring-pelorous-100"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="canton"
                    className="block text-sm text-gray-600"
                  >
                    {t("form.canton")}
                  </label>
                  <input
                    id="canton"
                    type="text"
                    value={canton}
                    onChange={(e) => setCanton(e.target.value)}
                    placeholder="VD"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-pelorous-300 focus:outline-none focus:ring-2 focus:ring-pelorous-100"
                  />
                </div>
              </div>
            </div>

            {/* Timbre Reduction Section */}
            <div className="space-y-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  {t("form.timbreReduction")}
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  {t("form.timbreReductionHelp")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label
                  className={cn(
                    "relative cursor-pointer rounded-xl border-2 bg-white p-4 transition-all",
                    timbreReduction === "20"
                      ? "border-gray-900"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    name="timbreReduction"
                    value="20"
                    checked={timbreReduction === "20"}
                    onChange={() => setTimbreReduction("20")}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2",
                        timbreReduction === "20"
                          ? "border-gray-900 bg-gray-900"
                          : "border-gray-300"
                      )}
                    >
                      {timbreReduction === "20" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">20%</p>
                      <p className="text-xs text-gray-500">
                        {t("form.timbre20")}
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={cn(
                    "relative cursor-pointer rounded-xl border-2 bg-white p-4 transition-all",
                    timbreReduction === "40"
                      ? "border-gray-900"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    name="timbreReduction"
                    value="40"
                    checked={timbreReduction === "40"}
                    onChange={() => setTimbreReduction("40")}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2",
                        timbreReduction === "40"
                          ? "border-gray-900 bg-gray-900"
                          : "border-gray-300"
                      )}
                    >
                      {timbreReduction === "40" && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">40%</p>
                      <p className="text-xs text-gray-500">
                        {t("form.timbre40")}
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs text-amber-700">{t("form.timbreInfo")}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 border-t border-gray-100 pt-8">
              <Link
                href="/app"
                className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                {tCommon("cancel")}
              </Link>
              <button
                type="submit"
                disabled={createOrg.isPending}
                className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              >
                {createOrg.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {createOrg.isPending ? tCommon("loading") : t("create")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
