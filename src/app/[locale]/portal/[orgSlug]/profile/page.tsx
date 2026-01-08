"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { User, Mail, Phone, MapPin, Zap, Download, Loader2 } from "lucide-react";

export default function PortalProfilePage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("portal");

  const { data: memberData, isLoading } = api.member.getMyMembership.useQuery({
    orgSlug: params.orgSlug,
  });

  const exportMutation = api.member.exportMyData.useMutation({
    onSuccess: (data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kiwatt-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });

  const handleExportData = () => {
    exportMutation.mutate({ orgSlug: params.orgSlug });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pelorous-600" />
      </div>
    );
  }

  const member = memberData?.membership;
  const org = memberData?.organization;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-light tracking-tight text-gray-900">
          {t("myProfile")}
        </h1>
        <p className="mt-3 text-gray-400">{t("profileSubtitle")}</p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-pelorous-50 text-2xl font-light text-pelorous-600">
            {member?.firstname?.[0]}{member?.lastname?.[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-light text-gray-900">
              {member?.firstname} {member?.lastname}
            </h2>
            <p className="mt-1 text-gray-400">{t("memberOf")} {org?.name}</p>

            <div className="mt-6 grid grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-50 p-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("email")}</p>
                  <p className="text-sm text-gray-900">{member?.email}</p>
                </div>
              </div>

              {member?.phone && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t("phone")}</p>
                    <p className="text-sm text-gray-900">{member?.phone}</p>
                  </div>
                </div>
              )}

              {(member?.address || member?.city) && (
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t("address")}</p>
                    <p className="text-sm text-gray-900">
                      {member?.address && `${member.address}, `}
                      {member?.postalCode} {member?.city}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-50 p-2">
                  <Zap className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("podNumber")}</p>
                  <p className="font-mono text-sm text-gray-900">{member?.podNumber}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Installation Info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <h3 className="text-lg font-light text-gray-900">{t("installationInfo")}</h3>

        <div className="mt-6 grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-400">{t("installationType")}</p>
            <p className="mt-1 text-gray-900">
              {t(`types.${member?.installationType}`)}
            </p>
          </div>

          {member?.solarCapacityKwp && parseFloat(member.solarCapacityKwp) > 0 && (
            <div>
              <p className="text-sm text-gray-400">{t("solarCapacity")}</p>
              <p className="mt-1 text-gray-900">{member.solarCapacityKwp} kWp</p>
            </div>
          )}

          {member?.batteryCapacityKwh && parseFloat(member.batteryCapacityKwh) > 0 && (
            <div>
              <p className="text-sm text-gray-400">{t("batteryCapacity")}</p>
              <p className="mt-1 text-gray-900">{member.batteryCapacityKwh} kWh</p>
            </div>
          )}
        </div>
      </div>

      {/* Organization Info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <h3 className="text-lg font-light text-gray-900">{t("organizationInfo")}</h3>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400">{t("organizationName")}</p>
            <p className="mt-1 text-gray-900">{org?.name}</p>
          </div>

          {(org?.address || org?.city) && (
            <div>
              <p className="text-sm text-gray-400">{t("address")}</p>
              <p className="mt-1 text-gray-900">
                {org?.address && `${org.address}, `}
                {org?.postalCode} {org?.city}
              </p>
            </div>
          )}

          {org?.contactEmail && (
            <div>
              <p className="text-sm text-gray-400">{t("contactEmail")}</p>
              <p className="mt-1 text-gray-900">{org.contactEmail}</p>
            </div>
          )}

          {org?.contactPhone && (
            <div>
              <p className="text-sm text-gray-400">{t("contactPhone")}</p>
              <p className="mt-1 text-gray-900">{org.contactPhone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Data Privacy */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <h3 className="text-lg font-light text-gray-900">{t("dataPrivacy")}</h3>
        <p className="mt-2 text-sm text-gray-500">{t("dataPrivacyDescription")}</p>

        <div className="mt-6">
          <button
            onClick={handleExportData}
            disabled={exportMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {exportMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t("downloadMyData")}
          </button>
        </div>
      </div>
    </div>
  );
}
