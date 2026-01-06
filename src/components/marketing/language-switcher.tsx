"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "~/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { locales, localeNames, type Locale } from "~/i18n/config";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(value: string) {
    router.replace(pathname, { locale: value as Locale });
  }

  return (
    <Select defaultValue={locale} onValueChange={onSelectChange}>
      <SelectTrigger className="w-[130px] border-none bg-transparent">
        <Globe className="mr-2 h-4 w-4 text-pelorous-500" />
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
