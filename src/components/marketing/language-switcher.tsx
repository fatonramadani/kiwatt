"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { locales, localeNames, type Locale } from "~/i18n/config";
import { Globe, Check } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleSelect(newLocale: Locale) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-light text-gray-500 outline-none transition-colors hover:text-gray-900">
        <Globe className="h-4 w-4 text-gray-400" />
        <span>{localeNames[locale as Locale]}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => handleSelect(loc)}
            className="flex cursor-pointer items-center justify-between text-sm font-light"
          >
            {localeNames[loc]}
            {locale === loc && <Check className="h-4 w-4 text-gray-500" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
