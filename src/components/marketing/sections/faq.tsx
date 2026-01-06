"use client";

import { useTranslations } from "next-intl";

const faqs = ["q1", "q2", "q3"];

export function FAQSection() {
  const t = useTranslations("landing.faq");

  return (
    <section id="faq" className="bg-pelorous-50/50 py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-20 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-pelorous-500">
              FAQ
            </p>
            <h2 className="text-4xl font-light leading-tight tracking-tight text-pelorous-950 lg:text-5xl">
              {t("title")}
            </h2>
          </div>

          <div className="space-y-12">
            {faqs.map((faq, index) => (
              <div
                key={faq}
                className="border-b border-pelorous-200 pb-12 last:border-0"
              >
                <h3 className="text-lg font-light text-pelorous-950">
                  {t(`${faq}.question`)}
                </h3>
                <p className="mt-4 text-sm font-light leading-relaxed text-pelorous-600">
                  {t(`${faq}.answer`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
