"use client";

import { useTranslations } from "next-intl";

import { Users, Zap, FileText } from "lucide-react";

const features = [
  { key: "memberManagement", number: "01", icon: Users, color: "bg-sky-50 text-sky-500" },
  { key: "energyTracking", number: "02", icon: Zap, color: "bg-emerald-50 text-emerald-500" },
  { key: "autoInvoicing", number: "03", icon: FileText, color: "bg-violet-50 text-violet-500" },
];

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="bg-white py-16 sm:py-24 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-10 max-w-xl sm:mb-20">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            Features
          </p>
          <h2 className="text-3xl font-light leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base font-light text-gray-500 sm:mt-6 sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="group relative rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-sm sm:p-10"
              >
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${feature.color.split(" ")[0]}`}>
                  <Icon className={`h-6 w-6 ${feature.color.split(" ")[1]}`} />
                </div>
                <h3 className="text-xl font-light text-gray-900">
                  {t(`${feature.key}.title`)}
                </h3>
                <p className="mt-4 text-sm font-light leading-relaxed text-gray-500">
                  {t(`${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
