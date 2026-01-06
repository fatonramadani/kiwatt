"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

export function PricingSection() {
  const t = useTranslations("landing.pricing");

  const plans = [
    { key: "starter", popular: false },
    { key: "pro", popular: true },
  ];

  return (
    <section id="pricing" className="bg-white py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-20 max-w-xl">
          <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-pelorous-500">
            Pricing
          </p>
          <h2 className="text-4xl font-light leading-tight tracking-tight text-pelorous-950 lg:text-5xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-px bg-pelorous-200 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`flex flex-col justify-between bg-white p-12 ${
                plan.popular ? "bg-pelorous-50/50" : ""
              }`}
            >
              <div>
                {plan.popular && (
                  <span className="mb-6 inline-block text-xs font-light uppercase tracking-[0.2em] text-pelorous-500">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-light text-pelorous-950">
                  {t(`${plan.key}.name`)}
                </h3>
                <p className="mt-2 text-sm font-light text-pelorous-600">
                  {t(`${plan.key}.description`)}
                </p>
                <p className="mt-8 text-4xl font-light text-pelorous-950">
                  {t(`${plan.key}.price`)}
                </p>

                <ul className="mt-10 space-y-4">
                  {(t.raw(`${plan.key}.features`) as string[]).map(
                    (feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-4 text-sm font-light text-pelorous-700"
                      >
                        <span className="h-px w-4 bg-pelorous-300" />
                        {feature}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <Link href="/register" className="mt-12">
                <Button
                  className={`group w-full rounded-none py-6 text-sm font-light ${
                    plan.popular
                      ? "bg-pelorous-950 hover:bg-pelorous-800"
                      : "border border-pelorous-300 bg-transparent text-pelorous-950 hover:bg-pelorous-50"
                  }`}
                >
                  Get started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
