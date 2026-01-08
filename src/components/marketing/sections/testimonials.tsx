"use client";

import { useTranslations } from "next-intl";
import { Quote } from "lucide-react";

export function TestimonialsSection() {
  const t = useTranslations("landing.testimonials");

  const items = [
    { index: 0, gradient: "from-violet-50 to-purple-50", quoteColor: "text-violet-300" },
    { index: 1, gradient: "from-sky-50 to-blue-50", quoteColor: "text-sky-300" },
  ];

  return (
    <section className="bg-white py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-light tracking-tight text-gray-900 lg:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.index}
              className={`relative rounded-2xl bg-gradient-to-br ${item.gradient} p-10`}
            >
              <Quote className={`mb-6 h-8 w-8 ${item.quoteColor}`} />
              <blockquote className="text-xl font-light leading-relaxed text-gray-900">
                &ldquo;{t(`items.${item.index}.quote`)}&rdquo;
              </blockquote>
              <div className="mt-8 border-t border-white/50 pt-6">
                <p className="font-light text-gray-900">
                  {t(`items.${item.index}.author`)}
                </p>
                <p className="mt-1 text-sm font-light text-gray-500">
                  {t(`items.${item.index}.role`)}, {t(`items.${item.index}.company`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
