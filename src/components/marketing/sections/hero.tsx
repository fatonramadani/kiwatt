"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="bg-pelorous-50/30 relative min-h-screen overflow-hidden">
      {/* Electric pylons background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
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
          <p className="text-pelorous-500 mb-6 flex items-center gap-3 text-sm font-light tracking-[0.3em] uppercase">
            <span className="bg-pelorous-500 h-px w-8" />
            {t("tagline")}
          </p>

          <h1 className="text-pelorous-950 text-5xl leading-[1.1] font-light tracking-tight md:text-6xl lg:text-7xl">
            {t("title")}
          </h1>

          <p className="text-pelorous-600 mt-8 max-w-xl text-lg leading-relaxed font-light">
            {t("subtitle")}
          </p>

          <div className="mt-12 flex items-center gap-8">
            <Link href="/register">
              <Button className="group bg-pelorous-950 hover:bg-pelorous-800 rounded-none px-8 py-6 text-sm font-light tracking-wide">
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a
              href="#features"
              className="text-pelorous-700 hover:text-pelorous-950 text-sm font-light underline underline-offset-4 transition-colors"
            >
              {t("ctaSecondary")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
