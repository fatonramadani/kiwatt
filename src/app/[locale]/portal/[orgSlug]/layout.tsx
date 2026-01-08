"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "~/i18n/navigation";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Zap,
  User,
  LogOut,
  Globe,
  Check,
  Menu,
  X,
  Home,
} from "lucide-react";
import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import { locales, localeNames, type Locale } from "~/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

function SidebarContent({
  memberData,
  navItems,
  locale,
  handleLocaleChange,
  handleLogout,
  t,
  onNavigate,
}: {
  memberData: { organization: { name: string }; membership: { firstname: string; lastname: string } } | undefined;
  navItems: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; exact?: boolean }[];
  locale: string;
  handleLocaleChange: (locale: Locale) => void;
  handleLogout: () => void;
  t: (key: string) => string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-8">
        <span className="text-xl font-normal tracking-tight text-gray-900">
          kiwatt
        </span>
        <span className="ml-2 rounded-full bg-pelorous-50 px-2 py-0.5 text-xs text-pelorous-600">
          Portal
        </span>
      </div>

      {/* Organization */}
      <div className="px-8 pb-6">
        <p className="truncate text-sm text-gray-400">
          {memberData?.organization.name}
        </p>
        <p className="mt-1 text-xs text-gray-300">
          {memberData?.membership.firstname} {memberData?.membership.lastname}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
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
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-pelorous-600"
                    : "text-gray-400 group-hover:text-gray-500"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Language & Logout */}
      <div className="space-y-1 p-4">
        {/* Language Switcher */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-gray-400 outline-none transition-colors hover:bg-gray-50 hover:text-gray-600">
            <Globe className="h-5 w-5" />
            {localeNames[locale as Locale]}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[140px]">
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

        {/* Logout */}
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

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ orgSlug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("portal");
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: memberData, isLoading } = api.member.getMyMembership.useQuery({
    orgSlug: params.orgSlug,
  });

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const handleLocaleChange = (newLocale: Locale) => {
    router.replace(pathname, { locale: newLocale });
  };

  const navItems = [
    { href: `/portal/${params.orgSlug}`, icon: LayoutDashboard, label: t("dashboard"), exact: true },
    { href: `/portal/${params.orgSlug}/invoices`, icon: FileText, label: t("invoices") },
    { href: `/portal/${params.orgSlug}/consumption`, icon: Zap, label: t("consumption") },
    { href: `/portal/${params.orgSlug}/smart-home`, icon: Home, label: t("smartHome") },
    { href: `/portal/${params.orgSlug}/profile`, icon: User, label: t("profile") },
  ];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pelorous-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 flex-col border-r border-gray-100 bg-white lg:flex">
        <SidebarContent
          memberData={memberData}
          navItems={navItems}
          locale={locale}
          handleLocaleChange={handleLocaleChange}
          handleLogout={handleLogout}
          t={t}
        />
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-100 bg-white px-4 lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-normal tracking-tight text-gray-900">
            kiwatt
          </span>
          <span className="rounded-full bg-pelorous-50 px-2 py-0.5 text-xs text-pelorous-600">
            Portal
          </span>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-gray-100 bg-white lg:hidden">
            {/* Close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>

            <SidebarContent
              memberData={memberData}
              navItems={navItems}
              locale={locale}
              handleLocaleChange={handleLocaleChange}
              handleLogout={handleLogout}
              t={t}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="px-4 py-6 sm:px-6 lg:ml-72 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
