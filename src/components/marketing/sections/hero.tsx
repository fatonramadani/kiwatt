"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Electric pylons background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <Image
          src="/1555193034.svg"
          alt=""
          fill
          className="object-cover object-bottom"
          priority
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pt-20 lg:px-12">
        <div className="max-w-4xl">
          <p className="mb-6 flex items-center gap-3 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            <span className="h-px w-8 bg-gray-300" />
            {t("tagline")}
          </p>

          <h1 className="text-5xl font-light leading-[1.1] tracking-tight text-gray-900 md:text-6xl lg:text-7xl">
            {t("title")}
          </h1>

          <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-gray-500">
            {t("subtitle")}
          </p>

          <div className="mt-12 flex items-center gap-8">
            <Link
              href="/register"
              className="group flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-4 text-sm font-light tracking-wide text-white transition-colors hover:bg-gray-800"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="text-sm font-light text-gray-500 underline underline-offset-4 transition-colors hover:text-gray-900"
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
