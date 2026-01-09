"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const t = useTranslations("landing.cta");

  return (
    <section className="bg-white py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-12">
        <h2 className="mx-auto max-w-3xl text-4xl font-light leading-tight tracking-tight text-gray-900 lg:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg font-light text-gray-500">
          {t("subtitle")}
        </p>
        <a
          href="mailto:info@kiwatt.ch?subject=Demande d'accès au programme Alpha Kiwatt"
          className="group mt-12 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-12 py-4 text-sm font-light tracking-wide text-white transition-colors hover:bg-gray-800"
        >
          {t("button")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
