"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  const t = useTranslations("landing.cta");

  return (
    <section className="bg-white py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-12">
        <h2 className="mx-auto max-w-3xl text-4xl font-light leading-tight tracking-tight text-pelorous-950 lg:text-5xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg font-light text-pelorous-600">
          {t("subtitle")}
        </p>
        <Link href="/register" className="mt-12 inline-block">
          <Button className="group rounded-none bg-pelorous-950 px-12 py-6 text-sm font-light tracking-wide hover:bg-pelorous-800">
            {t("button")}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
