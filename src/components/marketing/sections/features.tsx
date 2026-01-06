"use client";

import { useTranslations } from "next-intl";

const features = [
  { key: "memberManagement", number: "01" },
  { key: "energyTracking", number: "02" },
  { key: "autoInvoicing", number: "03" },
  { key: "dashboard", number: "04" },
  { key: "distribution", number: "05" },
  { key: "multiLanguage", number: "06" },
];

export function FeaturesSection() {
  const t = useTranslations("landing.features");

  return (
    <section id="features" className="bg-white py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-20 max-w-xl">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-pelorous-500">
            Features
          </p>
          <h2 className="text-4xl font-light leading-tight tracking-tight text-pelorous-950 lg:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-px bg-pelorous-200 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.key}
              className="group relative bg-white p-10 transition-colors hover:bg-pelorous-50/50"
            >
              {/* Accent line on hover */}
              <div className="absolute left-0 top-0 h-0.5 w-0 bg-pelorous-500 transition-all duration-300 group-hover:w-full" />

              <span className="text-xs font-light text-pelorous-400 transition-colors group-hover:text-pelorous-500">
                {feature.number}
              </span>
              <h3 className="mt-6 text-xl font-light text-pelorous-950">
                {t(`${feature.key}.title`)}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-pelorous-600">
                {t(`${feature.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
