"use client";

import { useTranslations } from "next-intl";
import {
  Users,
  Zap,
  FileText,
  LayoutDashboard,
  Split,
  Globe,
  QrCode,
  Shield,
} from "lucide-react";

const features = [
  {
    key: "memberManagement",
    icon: Users,
    color: "text-sky-500",
    bg: "bg-sky-50",
  },
  {
    key: "energyTracking",
    icon: Zap,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    key: "autoInvoicing",
    icon: FileText,
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  { key: "qrBill", icon: QrCode, color: "text-red-500", bg: "bg-red-50" },
  {
    key: "dashboard",
    icon: LayoutDashboard,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    key: "distribution",
    icon: Split,
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
  {
    key: "multiLanguage",
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    key: "security",
    icon: Shield,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

export function AllFeaturesSection() {
  const t = useTranslations("landing.allFeatures");

  return (
    <section className="bg-gray-50 py-16 sm:py-24 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-20">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            {t("label")}
          </p>
          <h2 className="mx-auto max-w-3xl text-3xl font-light leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base font-light text-gray-500 sm:mt-6 sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-sm"
              >
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${feature.bg}`}
                >
                  <Icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-base font-medium text-gray-900">
                  {t(`items.${feature.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed font-light text-gray-500">
                  {t(`items.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
