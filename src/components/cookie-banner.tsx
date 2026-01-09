"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "~/i18n/navigation";
import { useTranslations } from "next-intl";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const t = useTranslations("cookieBanner");

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Small delay to avoid layout shift on page load
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("cookie-consent", "dismissed");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              {t("message")}{" "}
              <Link
                href="/privacy"
                className="text-pelorous-600 underline hover:text-pelorous-700"
              >
                {t("learnMore")}
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAccept}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              {t("accept")}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label={t("close")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
