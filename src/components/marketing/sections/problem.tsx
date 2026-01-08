"use client";

import { useTranslations } from "next-intl";
import { Clock, AlertTriangle, TrendingDown } from "lucide-react";

const problemItems = [
  { key: "time", icon: Clock, color: "bg-amber-50 text-amber-500" },
  { key: "errors", icon: AlertTriangle, color: "bg-rose-50 text-rose-500" },
  { key: "delays", icon: TrendingDown, color: "bg-orange-50 text-orange-500" },
];

export function ProblemSection() {
  const t = useTranslations("landing.problem");

  return (
    <section className="bg-gray-50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            {t("label")}
          </p>
          <h2 className="mx-auto max-w-3xl text-3xl font-light leading-tight tracking-tight text-gray-900 lg:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {problemItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="rounded-2xl border border-gray-200 bg-white p-8 text-center"
              >
                <div className={`mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl ${item.color.split(" ")[0]}`}>
                  <Icon className={`h-6 w-6 ${item.color.split(" ")[1]}`} />
                </div>
                <p className="text-2xl font-light text-gray-900">
                  {t(`items.${item.key}.value`)}
                </p>
                <p className="mt-2 text-sm font-light text-gray-500">
                  {t(`items.${item.key}.label`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
