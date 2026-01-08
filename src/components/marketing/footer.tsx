"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { DatabaseZap } from "lucide-react";

export function MarketingFooter() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="flex flex-col justify-between gap-12 lg:flex-row">
          <div className="max-w-sm">
            <Link
              href="/"
              className="flex items-center gap-2 text-2xl font-light tracking-tight text-gray-900"
            >
              <DatabaseZap className="h-6 w-6" strokeWidth={1.5} />
              kiwatt
            </Link>
            <p className="mt-6 text-sm leading-relaxed font-light text-gray-500">
              {t("description")}
            </p>
          </div>

          <div className="flex gap-20">
            <div>
              <h4 className="text-xs font-light tracking-[0.2em] text-gray-400 uppercase">
                Legal
              </h4>
              <ul className="mt-6 space-y-4">
                <li>
                  <Link
                    href="/legal"
                    className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {t("legal")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {t("privacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm font-light text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {t("terms")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-light tracking-[0.2em] text-gray-400 uppercase">
                {t("contact")}
              </h4>
              <ul className="mt-6 space-y-4">
                <li className="text-sm font-light text-gray-500">
                  info@kiwatt.ch
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-100 pt-8">
          <p className="text-xs font-light text-gray-400">
            &copy; {new Date().getFullYear()} Kiwatt. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
