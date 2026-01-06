"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "~/i18n/navigation";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeft, Zap } from "lucide-react";

export default function NewOrganizationPage() {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [commune, setCommune] = useState("");
  const [canton, setCanton] = useState("");
  const [error, setError] = useState("");

  const utils = api.useUtils();
  const createOrg = api.organization.create.useMutation({
    onSuccess: (data) => {
      void utils.organization.list.invalidate();
      router.push(`/app/${data.slug}/dashboard`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug from name
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 50);
    setSlug(generatedSlug);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(tValidation("required"));
      return;
    }

    if (!slug.trim()) {
      setError(tValidation("required"));
      return;
    }

    createOrg.mutate({
      name: name.trim(),
      slug: slug.trim(),
      commune: commune.trim() || undefined,
      canton: canton.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-pelorous-50/30">
      <div className="mx-auto max-w-2xl px-6 py-16">
        {/* Header */}
        <div className="mb-12 flex items-center justify-between">
          <Link
            href="/app"
            className="flex items-center gap-2 text-sm text-pelorous-600 hover:text-pelorous-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("back")}
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pelorous-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-pelorous-950">Wattly</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t("create")}</CardTitle>
            <CardDescription>
              Configure your local energy community settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">{t("form.name")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="CEL Commune de Lausanne"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{t("form.slug")}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-pelorous-500">wattly.ch/app/</span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]/g, "")
                          .slice(0, 50)
                      )
                    }
                    placeholder="cel-lausanne"
                    className="flex-1 bg-white"
                  />
                </div>
                <p className="text-xs text-pelorous-500">{t("form.slugHelp")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="commune">Commune</Label>
                  <Input
                    id="commune"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="Lausanne"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="canton">Canton</Label>
                  <Input
                    id="canton"
                    value={canton}
                    onChange={(e) => setCanton(e.target.value)}
                    placeholder="VD"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link href="/app">
                  <Button type="button" variant="outline">
                    {tCommon("cancel")}
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="bg-pelorous-600 hover:bg-pelorous-700"
                  disabled={createOrg.isPending}
                >
                  {createOrg.isPending ? tCommon("loading") : t("create")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
