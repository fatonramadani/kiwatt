"use client";

import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useRouter } from "~/i18n/navigation";
import { authClient } from "~/server/better-auth/client";
import { LogOut, Settings, ChevronDown } from "lucide-react";

interface HeaderProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  orgSlug: string;
}

export function AppHeader({ user, orgSlug }: HeaderProps) {
  const t = useTranslations("nav");
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-gray-200 bg-white px-6">
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
    </header>
  );
}
