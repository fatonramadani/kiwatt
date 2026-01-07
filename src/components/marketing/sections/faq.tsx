"use client";

import { useTranslations } from "next-intl";

const faqs = ["q1", "q2", "q3", "q4"];

export function FAQSection() {
  const t = useTranslations("landing.faq");

  return (
    <section id="faq" className="bg-gray-50 py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-20 lg:grid-cols-2">
          <div>
            <p className="mb-4 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
              FAQ
            </p>
            <h2 className="text-4xl font-light leading-tight tracking-tight text-gray-900 lg:text-5xl">
              {t("title")}
            </h2>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div
                key={faq}
                className="rounded-2xl border border-gray-100 bg-white p-8"
              >
                <h3 className="flex items-start gap-4 text-lg font-light text-gray-900">
                  <span className="text-sm font-light text-gray-400">
                    0{index + 1}
                  </span>
                  {t(`${faq}.question`)}
                </h3>
                <p className="mt-4 pl-8 text-sm font-light leading-relaxed text-gray-500">
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
