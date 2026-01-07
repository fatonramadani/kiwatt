"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "~/i18n/navigation";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  Users,
  Zap,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "~/i18n/navigation";
import { useState } from "react";
import { OrganizationSwitcher } from "./organization-switcher";

interface SidebarProps {
  orgSlug: string;
  orgName: string;
}

function SidebarContent({ orgSlug, orgName, onNavigate }: SidebarProps & { onNavigate?: () => void }) {
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
    { href: `/app/${orgSlug}/reports`, icon: BarChart3, label: t("reports") },
    { href: `/app/${orgSlug}/settings`, icon: Settings, label: t("settings") },
  ];

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-8">
        <Link href="/app" className="text-xl font-normal tracking-tight text-gray-900">
          wattly
        </Link>
      </div>

      {/* Organization Switcher */}
      <div className="px-4 pb-6">
        <OrganizationSwitcher
          currentOrgSlug={orgSlug}
          currentOrgName={orgName}
          onNavigate={onNavigate}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                isActive
                  ? "bg-gray-50 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-pelorous-500" />
              )}
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-pelorous-600" : "text-gray-400 group-hover:text-gray-500"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <LogOut className="h-5 w-5" />
          {t("logout")}
        </button>
      </div>
    </>
  );
}

export function Sidebar({ orgSlug, orgName }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-gray-100 bg-white lg:flex">
      <SidebarContent orgSlug={orgSlug} orgName={orgName} />
    </aside>
  );
}

export function MobileSidebar({ orgSlug, orgName }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-gray-100 bg-white lg:hidden">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>

            <SidebarContent
              orgSlug={orgSlug}
              orgName={orgName}
              onNavigate={() => setIsOpen(false)}
            />
          </aside>
        </>
      )}
    </>
  );
}
