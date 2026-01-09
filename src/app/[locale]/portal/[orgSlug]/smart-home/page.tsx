"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Home,
  Zap,
  Battery,
  Car,
} from "lucide-react";

export default function SmartHomePage() {
  const params = useParams<{ orgSlug: string }>();
  const t = useTranslations("smartHome");
  const [copiedKey, setCopiedKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);

  const { data: memberData } = api.member.getMyMembership.useQuery({
    orgSlug: params.orgSlug,
  });

  const {
    data: apiKeyStatus,
    isLoading,
    refetch,
  } = api.member.getApiKeyStatus.useQuery(
    { orgId: memberData?.organization.id ?? "" },
    { enabled: !!memberData?.organization.id }
  );

  const generateMutation = api.member.generateApiKey.useMutation({
    onSuccess: (data) => {
      setNewApiKey(data.apiKey);
      void refetch();
    },
  });

  const revokeMutation = api.member.revokeApiKey.useMutation({
    onSuccess: () => {
      setNewApiKey(null);
      void refetch();
    },
  });

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleGenerate = () => {
    if (memberData?.organization.id) {
      generateMutation.mutate({ orgId: memberData.organization.id });
    }
  };

  const handleRevoke = () => {
    if (memberData?.organization.id) {
      revokeMutation.mutate({ orgId: memberData.organization.id });
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

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
          {t("title")}
        </h1>
        <p className="mt-3 text-gray-400">{t("description")}</p>
      </div>

      {/* API Key Card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-pelorous-50 p-2">
            <Key className="h-5 w-5 text-pelorous-600" />
          </div>
          <div>
            <h2 className="text-lg font-light text-gray-900">{t("apiKey")}</h2>
            <p className="text-sm text-gray-400">{t("apiKeyDescription")}</p>
          </div>
        </div>

        <div className="mt-6">
          {newApiKey ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  {t("keyWarning")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-gray-50 px-4 py-3 font-mono text-sm text-gray-900">
                  {newApiKey}
                </code>
                <button
                  onClick={() => handleCopyKey(newApiKey)}
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
                >
                  {copiedKey ? (
                    <Check className="h-5 w-5 text-green-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ) : apiKeyStatus?.hasApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                <div>
                  <code className="font-mono text-sm text-gray-600">
                    {apiKeyStatus.maskedKey}
                  </code>
                  {apiKeyStatus.apiKeyCreatedAt && (
                    <p className="mt-1 text-xs text-gray-400">
                      {t("createdAt")}:{" "}
                      {new Date(apiKeyStatus.apiKeyCreatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`}
                  />
                  {t("regenerateKey")}
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revokeMutation.isPending}
                  className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("revokeKey")}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">{t("noKey")}</p>
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-pelorous-600 px-4 py-2 text-sm text-white transition-colors hover:bg-pelorous-700 disabled:opacity-50"
              >
                <Key className="h-4 w-4" />
                {generateMutation.isPending ? "..." : t("generateKey")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* API Endpoints */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <h2 className="text-lg font-light text-gray-900">
          {t("endpoints.title")}
        </h2>

        <div className="mt-6 space-y-4">
          <EndpointCard
            icon={Zap}
            title={t("endpoints.forecast")}
            description={t("endpoints.forecastDesc")}
            endpoint={`${baseUrl}/api/v1/community/${params.orgSlug}/forecast`}
          />
          <EndpointCard
            icon={Battery}
            title={t("endpoints.surplus")}
            description={t("endpoints.surplusDesc")}
            endpoint={`${baseUrl}/api/v1/community/${params.orgSlug}/surplus`}
          />
          <EndpointCard
            icon={Car}
            title={t("endpoints.recommendations")}
            description={t("endpoints.recommendationsDesc")}
            endpoint={`${baseUrl}/api/v1/member/{your-api-key}/recommendations`}
            requiresAuth
          />
        </div>
      </div>

      {/* Home Assistant Setup */}
      <div className="rounded-2xl border border-gray-100 bg-white p-8">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <Home className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-light text-gray-900">
              {t("homeAssistant.title")}
            </h2>
            <p className="text-sm text-gray-400">
              {t("homeAssistant.description")}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700">
              {t("homeAssistant.sensorConfig")}
            </h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              <code>{`sensor:
  - platform: rest
    name: "CEL Surplus"
    resource: "${baseUrl}/api/v1/community/${params.orgSlug}/surplus"
    value_template: "{{ value_json.surplusKw }}"
    unit_of_measurement: "kW"
    scan_interval: 300`}</code>
            </pre>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700">
              {t("homeAssistant.automationConfig")}
            </h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
              <code>{`automation:
  - alias: "Start EV Charging on Surplus"
    trigger:
      - platform: numeric_state
        entity_id: sensor.cel_surplus
        above: 2
    action:
      - service: switch.turn_on
        target:
          entity_id: switch.ev_charger`}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function EndpointCard({
  icon: Icon,
  title,
  description,
  endpoint,
  requiresAuth,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  endpoint: string;
  requiresAuth?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gray-50 p-2">
            <Icon className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <p className="mt-1 text-xs text-gray-400">{description}</p>
            {requiresAuth && (
              <span className="mt-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">
                Requires API Key
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 truncate rounded-lg bg-gray-50 px-3 py-2 font-mono text-xs text-gray-600">
          GET {endpoint}
        </code>
        <button
          onClick={handleCopy}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
