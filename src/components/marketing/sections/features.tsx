"use client";

import { useTranslations } from "next-intl";

const features = [
  { key: "memberManagement", number: "01" },
  { key: "energyTracking", number: "02" },
  { key: "autoInvoicing", number: "03" },
];

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="bg-white py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-20 max-w-xl">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            Features
          </p>
          <h2 className="text-4xl font-light leading-tight tracking-tight text-gray-900 lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-lg font-light text-gray-500">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="group relative rounded-2xl border border-gray-100 bg-white p-10 transition-all hover:border-gray-200 hover:shadow-sm"
            >
              <span className="text-xs font-light text-gray-300 transition-colors group-hover:text-gray-400">
                {feature.number}
              </span>
              <h3 className="mt-6 text-xl font-light text-gray-900">
                {t(`${feature.key}.title`)}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-gray-500">
                {t(`${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
