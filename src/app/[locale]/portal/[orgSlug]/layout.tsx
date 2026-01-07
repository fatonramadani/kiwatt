"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "~/i18n/navigation";
import { cn } from "~/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Zap,
  User,
  LogOut,
} from "lucide-react";
import { api } from "~/trpc/react";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "~/i18n/navigation";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ orgSlug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("portal");

  const { data: memberData, isLoading } = api.member.getMyMembership.useQuery({
    orgSlug: params.orgSlug,
  });

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: `/portal/${params.orgSlug}`, icon: LayoutDashboard, label: t("dashboard"), exact: true },
    { href: `/portal/${params.orgSlug}/invoices`, icon: FileText, label: t("invoices") },
    { href: `/portal/${params.orgSlug}/consumption`, icon: Zap, label: t("consumption") },
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-gray-100 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center px-8">
          <span className="text-xl font-normal tracking-tight text-gray-900">
            wattly
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
      </aside>

      {/* Main Content */}
      <main className="ml-72 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
