"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export function AnnouncementBar() {
  const t = useTranslations("announcement");
  const [isVisible, setIsVisible] = useState(true);

  // Update CSS variable for header offset
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--announcement-height",
      isVisible ? "40px" : "0px"
    );
    return () => {
      document.documentElement.style.setProperty("--announcement-height", "0px");
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-pelorous-600 px-4 py-2.5 text-center text-sm text-white">
      <span className="font-medium">{t("alpha")}</span>
      <span className="mx-2">—</span>
      <span className="text-pelorous-100">{t("alphaDescription")}</span>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-pelorous-200 transition-colors hover:bg-pelorous-500 hover:text-white"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
