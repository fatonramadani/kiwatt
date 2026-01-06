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
    <section className="bg-pelorous-950 py-32 text-white lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-20 max-w-xl">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-pelorous-400">
            Process
          </p>
          <h2 className="text-4xl font-light leading-tight tracking-tight lg:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.key} className="relative">
              <span className="text-6xl font-extralight text-pelorous-700">
                {step.number}
              </span>
              <h3 className="mt-6 text-xl font-light">
                {t(`${step.key}.title`)}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-pelorous-300">
                {t(`${step.key}.description`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
