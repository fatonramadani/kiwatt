"use client";

import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Link, useRouter } from "~/i18n/navigation";
import { Plus, Building2, ChevronRight, Loader2 } from "lucide-react";

export default function AppPage() {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: organizations, isLoading } = api.organization.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          {tCommon("loading")}
        </div>
      </div>
    );
  }

  // If user has only one org, redirect directly
  if (organizations?.length === 1) {
    router.push(`/app/${organizations[0]!.slug}/dashboard`);
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:py-16">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-2xl font-light tracking-tight text-gray-900 sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-gray-400">{t("select")}</p>
        </div>

        {organizations && organizations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {organizations.map((org) => (
              <Link key={org.id} href={`/app/${org.slug}/dashboard`}>
                <div className="group rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:border-gray-200 hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 transition-colors group-hover:bg-gray-200">
                      <Building2 className="h-6 w-6 text-gray-600" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-gray-400" />
                  </div>
                  <div className="mt-5">
                    <h3 className="font-medium text-gray-900">{org.name}</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      {org.commune && org.canton
                        ? `${org.commune}, ${org.canton}`
                        : org.slug}
                    </p>
                  </div>
                  <div className="mt-4">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {org.role === "admin" ? "Admin" : "Member"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {/* Create new org card */}
            <Link href="/app/new">
              <div className="group flex h-full min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:bg-gray-50">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 transition-colors group-hover:border-gray-300">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-4 font-medium text-gray-600">{t("create")}</p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">
              {t("noOrganizations")}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-gray-400">
              {t("createFirst")}
            </p>
            <Link href="/app/new" className="mt-6 inline-block">
              <button className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                <Plus className="h-4 w-4" />
                {t("create")}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
