"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "~/i18n/navigation";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  Users,
  Zap,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "~/i18n/navigation";

interface SidebarProps {
  orgSlug: string;
  orgName: string;
}

export function Sidebar({ orgSlug, orgName }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: `/app/${orgSlug}/dashboard`, icon: LayoutDashboard, label: t("dashboard") },
    { href: `/app/${orgSlug}/members`, icon: Users, label: t("members") },
    { href: `/app/${orgSlug}/energy`, icon: Zap, label: t("energy") },
    { href: `/app/${orgSlug}/invoices`, icon: FileText, label: t("invoices") },
    { href: `/app/${orgSlug}/settings`, icon: Settings, label: t("settings") },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <Link href="/app" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-gray-900">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-medium text-gray-900">Wattly</span>
        </Link>
      </div>

      {/* Organization */}
      <div className="border-b border-gray-200 px-4 py-3">
        <Link
          href="/app"
          className="block truncate text-sm text-gray-600 hover:text-gray-900"
        >
          {orgName}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                isActive
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-200 p-2">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </button>
      </div>
    </aside>
  );
}
