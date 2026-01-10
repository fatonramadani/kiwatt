"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { LanguageSwitcher } from "~/components/marketing/language-switcher";
import { DatabaseZap, Menu, X } from "lucide-react";

export function MarketingHeader() {
  const t = useTranslations("nav");
  const tLanding = useTranslations("landing.nav");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking a link
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header
      style={{ top: "var(--announcement-height, 0px)" }}
      className={`fixed z-50 w-full transition-all duration-300 ${
        scrolled || mobileMenuOpen
          ? "bg-white/95 shadow-sm backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-12">
        <Link href="/" className="flex items-center gap-2 text-xl font-light tracking-tight text-gray-900 sm:text-2xl">
          <DatabaseZap className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.5} />
          kiwatt
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex lg:gap-12">
          <Link href="/#features" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            {tLanding("features")}
          </Link>
          <Link href="/#pricing" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            {tLanding("pricing")}
          </Link>
          <Link href="/calculateur" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            Calculateur
          </Link>
          <Link href="/blog" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            Blog
          </Link>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-6 md:flex">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900">
            {t("login")}
          </Link>
          <a
            href="mailto:info@kiwatt.ch?subject=Demande d'accès au programme Alpha Kiwatt"
            className="rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-light text-white transition-colors hover:bg-gray-800"
          >
            {t("joinAlpha")}
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link
              href="/#features"
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-base font-light text-gray-600 hover:bg-gray-50"
            >
              {tLanding("features")}
            </Link>
            <Link
              href="/#pricing"
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-base font-light text-gray-600 hover:bg-gray-50"
            >
              {tLanding("pricing")}
            </Link>
            <Link
              href="/calculateur"
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-base font-light text-gray-600 hover:bg-gray-50"
            >
              Calculateur
            </Link>
            <Link
              href="/blog"
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-base font-light text-gray-600 hover:bg-gray-50"
            >
              Blog
            </Link>
          </nav>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between px-3">
              <span className="text-sm font-light text-gray-500">Langue</span>
              <LanguageSwitcher />
            </div>
            <Link
              href="/login"
              onClick={closeMobileMenu}
              className="rounded-lg px-3 py-2 text-base font-light text-gray-600 hover:bg-gray-50"
            >
              {t("login")}
            </Link>
            <a
              href="mailto:info@kiwatt.ch?subject=Demande d'accès au programme Alpha Kiwatt"
              onClick={closeMobileMenu}
              className="rounded-xl bg-gray-900 px-4 py-3 text-center text-sm font-light text-white hover:bg-gray-800"
            >
              {t("joinAlpha")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
