"use client";

import { useTranslations } from "next-intl";
import { FileSearch, Wrench, HeadphonesIcon, ArrowRight } from "lucide-react";

const services = [
  {
    key: "feasibility",
    icon: FileSearch,
    price: "1'500",
    color: "bg-sky-50 text-sky-600",
  },
  {
    key: "turnkey",
    icon: Wrench,
    price: "6'500",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "support",
    icon: HeadphonesIcon,
    price: "2'400",
    priceUnit: "year",
    color: "bg-violet-50 text-violet-600",
  },
];

export function ServicesSection() {
  const t = useTranslations("landing.services");

  return (
    <section id="services" className="bg-gray-50 py-16 sm:py-24 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-10 max-w-xl sm:mb-20">
          <p className="mb-4 flex items-center gap-3 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            <span className="h-px w-8 bg-gray-300" />
            {t("label")}
          </p>
          <h2 className="text-3xl font-light leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-base font-light text-gray-500 sm:text-lg">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            const features = t.raw(`${service.key}.features`) as string[];

            return (
              <div
                key={service.key}
                className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-lg sm:p-8"
              >
                {/* Icon */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${service.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Title & Description */}
                <h3 className="mt-6 text-xl font-light text-gray-900">
                  {t(`${service.key}.title`)}
                </h3>
                <p className="mt-2 text-sm font-light text-gray-500">
                  {t(`${service.key}.description`)}
                </p>

                {/* Price */}
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <p className="text-3xl font-light text-gray-900">
                    CHF {service.price}
                    <span className="text-base text-gray-400">
                      {service.priceUnit === "year" ? "/an" : ""}
                    </span>
                  </p>
                </div>

                {/* Features */}
                <ul className="mt-6 flex-1 space-y-3">
                  {features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-sm font-light text-gray-600"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href={`mailto:info@kiwatt.ch?subject=${encodeURIComponent(t(`${service.key}.emailSubject`))}`}
                  className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-light text-gray-700 transition-colors hover:border-gray-900 hover:bg-gray-900 hover:text-white"
                >
                  {t(`${service.key}.cta`)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <div className="mt-10 rounded-2xl border border-gray-100 bg-white p-6 text-center sm:mt-16 sm:p-8">
          <p className="text-sm font-light text-gray-500">
            {t("customNote")}
          </p>
          <a
            href="mailto:info@kiwatt.ch"
            className="mt-4 inline-flex items-center gap-2 text-sm font-light text-gray-900 underline underline-offset-4 hover:text-gray-600"
          >
            {t("contactUs")}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
