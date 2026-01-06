"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";

export function MarketingFooter() {
  const t = useTranslations("landing.footer");

  return (
    <footer className="border-t border-pelorous-100 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
        <div className="flex flex-col justify-between gap-12 lg:flex-row">
          <div className="max-w-sm">
            <Link
              href="/"
              className="text-2xl font-light tracking-tight text-pelorous-950"
            >
              wattly
            </Link>
            <p className="mt-6 text-sm font-light leading-relaxed text-pelorous-600">
              {t("description")}
            </p>
          </div>

          <div className="flex gap-20">
            <div>
              <h4 className="text-xs font-light uppercase tracking-[0.2em] text-pelorous-500">
                Legal
              </h4>
              <ul className="mt-6 space-y-4">
                <li>
                  <Link
                    href="#"
                    className="text-sm font-light text-pelorous-700 transition-colors hover:text-pelorous-950"
                  >
                    {t("legal")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm font-light text-pelorous-700 transition-colors hover:text-pelorous-950"
                  >
                    {t("privacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-sm font-light text-pelorous-700 transition-colors hover:text-pelorous-950"
                  >
                    {t("terms")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-light uppercase tracking-[0.2em] text-pelorous-500">
                {t("contact")}
              </h4>
              <ul className="mt-6 space-y-4">
                <li className="text-sm font-light text-pelorous-700">
                  info@wattly.ch
                </li>
                <li className="text-sm font-light text-pelorous-700">
                  +41 21 000 00 00
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-pelorous-100 pt-8">
          <p className="text-xs font-light text-pelorous-500">
            &copy; {new Date().getFullYear()} Wattly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
