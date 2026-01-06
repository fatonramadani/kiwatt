"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative min-h-screen bg-pelorous-50/30">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 pt-20 lg:px-12">
        <div className="max-w-4xl">
          <p className="mb-6 text-sm font-light uppercase tracking-[0.3em] text-pelorous-500">
            Energy Community Management
          </p>

          <h1 className="text-5xl font-light leading-[1.1] tracking-tight text-pelorous-950 md:text-6xl lg:text-7xl">
            {t("title")}
          </h1>

          <p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-pelorous-600">
            {t("subtitle")}
          </p>

          <div className="mt-12 flex items-center gap-8">
            <Link href="/register">
              <Button className="group rounded-none bg-pelorous-950 px-8 py-6 text-sm font-light tracking-wide hover:bg-pelorous-800">
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a
              href="#features"
              className="text-sm font-light text-pelorous-700 underline underline-offset-4 transition-colors hover:text-pelorous-950"
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </div>

        {/* Minimal stats */}
        <div className="mt-24 grid grid-cols-3 gap-12 border-t border-pelorous-200 pt-12 md:max-w-xl">
          <div>
            <p className="text-3xl font-light text-pelorous-950">100+</p>
            <p className="mt-1 text-xs font-light uppercase tracking-wider text-pelorous-500">
              Active CELs
            </p>
          </div>
          <div>
            <p className="text-3xl font-light text-pelorous-950">500k+</p>
            <p className="mt-1 text-xs font-light uppercase tracking-wider text-pelorous-500">
              kWh Shared
            </p>
          </div>
          <div>
            <p className="text-3xl font-light text-pelorous-950">30%</p>
            <p className="mt-1 text-xs font-light uppercase tracking-wider text-pelorous-500">
              Avg. Savings
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
