"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const t = useTranslations("landing.cta");

  return (
    <section className="bg-white py-16 sm:py-24 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-12">
        <h2 className="mx-auto max-w-3xl text-3xl font-light leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base font-light text-gray-500 sm:mt-6 sm:text-lg">
          {t("subtitle")}
        </p>
        <a
          href="mailto:info@kiwatt.ch?subject=Demande d'accès au programme Alpha Kiwatt"
          className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-4 text-sm font-light tracking-wide text-white transition-colors hover:bg-gray-800 sm:mt-12 sm:px-12"
        >
          {t("button")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </section>
  );
}
