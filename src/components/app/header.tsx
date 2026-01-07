"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { usePathname, useRouter } from "~/i18n/navigation";
import { authClient } from "~/server/better-auth/client";
import { LogOut, Settings, ChevronDown, Globe, Check } from "lucide-react";
import { locales, localeNames, type Locale } from "~/i18n/config";
import { MobileSidebar } from "~/components/app/sidebar";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  orgSlug: string;
  orgName?: string;
}

export function AppHeader({ user, orgSlug, orgName }: HeaderProps) {
  const t = useTranslations("nav");
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-gray-50 px-4 sm:px-6 lg:justify-end lg:px-10">
      {/* Mobile menu */}
      <MobileSidebar orgSlug={orgSlug} orgName={orgName ?? ""} />

      {/* Right side items */}
      <div className="flex items-center gap-4">
        {/* Language Switcher */}
        <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="flex items-center gap-2 text-sm text-gray-500 outline-none transition-colors hover:text-gray-900">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{localeNames[locale as Locale]}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[140px]">
          {locales.map((loc) => (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className="flex cursor-pointer items-center justify-between text-sm"
            >
              {localeNames[loc]}
              {locale === loc && <Check className="h-4 w-4 text-pelorous-500" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-600">
              {initials}
            </div>
            <span className="hidden sm:inline">{user.name}</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="border-b border-gray-100 px-3 py-2">
            <p className="text-sm text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <DropdownMenuItem
            onClick={() => router.push(`/app/${orgSlug}/settings`)}
            className="cursor-pointer"
          >
            <Settings className="mr-2 h-4 w-4" />
            {t("settings")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            {t("logout")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}
