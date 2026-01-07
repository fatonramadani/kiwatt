"use client";

import { useTranslations } from "next-intl";

const steps = [
  { number: "01", key: "step1" },
  { number: "02", key: "step2" },
  { number: "03", key: "step3" },
  { number: "04", key: "step4" },
];

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");

  return (
    <section className="bg-gray-50 py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-20 max-w-xl">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            Process
          </p>
          <h2 className="text-4xl font-light leading-tight tracking-tight text-gray-900 lg:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.key}
              className="relative rounded-2xl border border-gray-100 bg-white p-8"
            >
              {/* Step number */}
              <div className="mb-6">
                <span className="text-5xl font-extralight text-gray-200">
                  {step.number}
                </span>
              </div>

              {/* Connector line for larger screens */}
              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gray-200 lg:block" />
              )}

              <h3 className="text-lg font-light text-gray-900">
                {t(`${step.key}.title`)}
              </h3>
              <p className="mt-3 text-sm font-light leading-relaxed text-gray-500">
                {t(`${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
