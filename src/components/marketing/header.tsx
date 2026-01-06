"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
import { LanguageSwitcher } from "~/components/marketing/language-switcher";

export function MarketingHeader() {
  const t = useTranslations("nav");

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link href="/" className="text-2xl font-light tracking-tight text-pelorous-950">
          wattly
        </Link>

        <nav className="hidden items-center gap-12 md:flex">
          <a href="#features" className="text-sm font-light text-pelorous-700 transition-colors hover:text-pelorous-950">
            Features
          </a>
          <a href="#pricing" className="text-sm font-light text-pelorous-700 transition-colors hover:text-pelorous-950">
            Pricing
          </a>
          <a href="#faq" className="text-sm font-light text-pelorous-700 transition-colors hover:text-pelorous-950">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-light text-pelorous-700 transition-colors hover:text-pelorous-950">
            {t("login")}
          </Link>
          <Link href="/register">
            <Button className="rounded-none bg-pelorous-950 px-6 py-2 text-sm font-light hover:bg-pelorous-800">
              {t("register")}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
