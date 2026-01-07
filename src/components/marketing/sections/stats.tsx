"use client";

import { useTranslations } from "next-intl";

const statItems = ["communities", "energy", "time", "hosting"];

export function StatsSection() {
  const t = useTranslations("landing.stats");

  return (
    <section className="bg-gray-50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-light tracking-tight text-gray-900 lg:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-gray-200 bg-white p-8 text-center"
            >
              <p className="text-4xl font-light tracking-tight text-gray-900 lg:text-5xl">
                {t(`${item}.value`)}
              </p>
              <p className="mt-3 text-sm font-light text-gray-500">
                {t(`${item}.label`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
