"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { LanguageSwitcher } from "~/components/marketing/language-switcher";
import { DatabaseZap } from "lucide-react";

export function MarketingHeader() {
  const t = useTranslations("nav");
  const tLanding = useTranslations("landing.nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      style={{ top: "var(--announcement-height, 0px)" }}
      className={`fixed z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/95 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2 text-2xl font-light tracking-tight text-gray-900">
          <DatabaseZap className="h-6 w-6" strokeWidth={1.5} />
          kiwatt
        </Link>

        <nav className="hidden items-center gap-12 md:flex">
          <a href="#features" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            {tLanding("features")}
          </a>
          <a href="#pricing" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            {tLanding("pricing")}
          </a>
          <a href="#faq" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            {tLanding("faq")}
          </a>
        </nav>

        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            {t("login")}
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-light text-white transition-colors hover:bg-gray-800"
          >
            {t("register")}
          </Link>
        </div>
      </div>
    </header>
  );
}
