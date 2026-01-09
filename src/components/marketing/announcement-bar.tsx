"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

export function AnnouncementBar() {
  const t = useTranslations("announcement");
  const [isVisible, setIsVisible] = useState(true);
  const barRef = useRef<HTMLDivElement>(null);

  // Update CSS variable for header offset based on actual height
  useEffect(() => {
    const updateHeight = () => {
      if (barRef.current && isVisible) {
        const height = barRef.current.offsetHeight;
        document.documentElement.style.setProperty(
          "--announcement-height",
          `${height}px`
        );
      } else {
        document.documentElement.style.setProperty("--announcement-height", "0px");
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
      document.documentElement.style.setProperty("--announcement-height", "0px");
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={barRef}
      className="fixed left-0 right-0 top-0 z-[60] bg-pelorous-600 px-10 py-2 text-center text-xs text-white sm:px-4 sm:py-2.5 sm:text-sm"
    >
      <span className="font-medium">{t("alpha")}</span>
      <span className="mx-1 sm:mx-2">—</span>
      <span className="text-pelorous-100">{t("alphaDescription")}</span>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-pelorous-200 transition-colors hover:bg-pelorous-500 hover:text-white sm:right-3"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
