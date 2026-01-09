"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  LayoutDashboard,
  Building2,
  Receipt,
  LogOut,
  Shield,
} from "lucide-react";
import { api } from "~/trpc/react";

const navigation = [
  { name: "Dashboard", href: "/app/admin", icon: LayoutDashboard },
  { name: "Organizations", href: "/app/admin/organizations", icon: Building2 },
  { name: "Invoices", href: "/app/admin/invoices", icon: Receipt },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { data: superAdminCheck, isLoading } =
    api.platformBilling.isSuperAdmin.useQuery();

  useEffect(() => {
    if (!isLoading && !superAdminCheck?.isSuperAdmin) {
      router.push("/app");
    }
  }, [superAdminCheck, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-pelorous-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!superAdminCheck?.isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-gray-900">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 px-6 border-b border-gray-800">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pelorous-500">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-semibold text-white">kiwatt</span>
              <span className="ml-2 rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">
                Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive =
                pathname === `/${locale}${item.href}` ||
                (item.href !== "/app/admin" &&
                  pathname.startsWith(`/${locale}${item.href}`));

              return (
                <Link
                  key={item.name}
                  href={`/${locale}${item.href}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Back to app */}
          <div className="border-t border-gray-800 p-4">
            <Link
              href={`/${locale}/app`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-800/50 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Back to App
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-72">
        <main className="px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
