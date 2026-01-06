"use client";

import { useTranslations } from "next-intl";
import { api } from "~/trpc/react";
import { Link, useRouter } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Plus, Building2, ChevronRight, Zap } from "lucide-react";

export default function AppPage() {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { data: organizations, isLoading } = api.organization.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-pelorous-50/30">
        <div className="animate-pulse text-pelorous-600">
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
    <div className="min-h-screen bg-pelorous-50/30">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pelorous-500">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-semibold text-pelorous-950">Wattly</span>
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-light text-pelorous-950">{t("title")}</h1>
        <p className="mb-8 text-pelorous-600">
          {t("select")}
        </p>

        {organizations && organizations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {organizations.map((org) => (
              <Link key={org.id} href={`/app/${org.slug}/dashboard`}>
                <Card className="cursor-pointer transition-all hover:border-pelorous-400 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pelorous-100">
                        <Building2 className="h-5 w-5 text-pelorous-600" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-pelorous-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {org.commune && org.canton
                        ? `${org.commune}, ${org.canton}`
                        : org.slug}
                    </CardDescription>
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-full bg-pelorous-100 px-2.5 py-0.5 text-xs font-medium text-pelorous-700">
                        {org.role === "admin" ? "Admin" : "Member"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}

            {/* Create new org card */}
            <Link href="/app/new">
              <Card className="cursor-pointer border-dashed transition-all hover:border-pelorous-400 hover:bg-pelorous-50/50">
                <CardContent className="flex h-full min-h-[180px] flex-col items-center justify-center py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pelorous-100">
                    <Plus className="h-6 w-6 text-pelorous-600" />
                  </div>
                  <p className="mt-3 font-medium text-pelorous-700">{t("create")}</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pelorous-100">
                <Building2 className="h-8 w-8 text-pelorous-600" />
              </div>
              <h3 className="mt-6 text-lg font-medium text-pelorous-950">
                {t("noOrganizations")}
              </h3>
              <p className="mt-2 max-w-sm text-pelorous-600">
                {t("createFirst")}
              </p>
              <Link href="/app/new" className="mt-6">
                <Button className="bg-pelorous-600 hover:bg-pelorous-700">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("create")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
