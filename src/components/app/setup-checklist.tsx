"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Check, Users, Settings, Zap, FileText } from "lucide-react";

interface SetupStatus {
  hasMembers: boolean;
  hasTariff: boolean;
  hasEnergyData: boolean;
  hasInvoices: boolean;
}

interface SetupChecklistProps {
  orgSlug: string;
  setupStatus: SetupStatus;
}

export function SetupChecklist({ orgSlug, setupStatus }: SetupChecklistProps) {
  const t = useTranslations("dashboard");

  const steps = [
    { key: "step1", completed: setupStatus.hasMembers, href: `/app/${orgSlug}/members`, icon: Users },
    { key: "step2", completed: setupStatus.hasTariff, href: `/app/${orgSlug}/settings`, icon: Settings },
    { key: "step3", completed: setupStatus.hasEnergyData, href: `/app/${orgSlug}/energy`, icon: Zap },
    { key: "step4", completed: setupStatus.hasInvoices, href: `/app/${orgSlug}/invoices`, icon: FileText },
  ] as const;

  const completedCount = steps.filter((s) => s.completed).length;

  if (completedCount === steps.length) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{t("setup.title")}</h3>
          <p className="text-sm text-gray-500">{t("setup.subtitle")}</p>
        </div>
        <span className="text-sm text-gray-400">{completedCount}/4</span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <Link
            key={step.key}
            href={step.href}
            className={`flex items-center gap-2 rounded-md border p-3 text-sm ${
              step.completed
                ? "border-gray-200 bg-gray-50 text-gray-400"
                : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {step.completed ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <step.icon className="h-4 w-4 text-gray-400" />
            )}
            <span className={step.completed ? "line-through" : ""}>
              {t(`setup.${step.key}`)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
