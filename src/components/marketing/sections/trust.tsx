"use client";

import { useTranslations } from "next-intl";
import { Flag, Shield, QrCode, Globe } from "lucide-react";

const trustItems = [
  { key: "swiss", icon: Flag, color: "bg-red-50 text-red-500" },
  { key: "gdpr", icon: Shield, color: "bg-emerald-50 text-emerald-500" },
  { key: "qrbill", icon: QrCode, color: "bg-blue-50 text-blue-500" },
  { key: "languages", icon: Globe, color: "bg-violet-50 text-violet-500" },
];

export function TrustSection() {
  const t = useTranslations("landing.trust");

  return (
    <section className="bg-gray-50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-light tracking-tight text-gray-900 lg:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="rounded-2xl border border-gray-200 bg-white p-8 text-center"
              >
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${item.color.split(" ")[0]}`}>
                  <Icon className={`h-6 w-6 ${item.color.split(" ")[1]}`} />
                </div>
                <h3 className="font-light text-gray-900">
                  {t(`items.${item.key}.title`)}
                </h3>
                <p className="mt-2 text-sm font-light text-gray-500">
                  {t(`items.${item.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
