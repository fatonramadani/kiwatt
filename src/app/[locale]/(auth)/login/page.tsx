"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authClient } from "~/server/better-auth/client";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Login failed");
      } else {
        // Redirect to returnUrl if provided, otherwise go to app
        router.push(returnUrl ?? "/app");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-10 shadow-sm">
      <p className="text-sm font-light uppercase tracking-[0.3em] text-gray-400">
        {t("tagline")}
      </p>
      <h2 className="mt-4 text-3xl font-light tracking-tight text-gray-900">
        {t("title")}
      </h2>
      <p className="mt-2 text-sm font-light text-gray-500">{t("subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-light uppercase tracking-[0.15em] text-gray-500"
          >
            {t("email")}
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nom@exemple.ch"
            className="rounded-xl border-gray-200 bg-gray-50 px-4 py-6 text-base font-light focus-visible:ring-gray-400"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-xs font-light uppercase tracking-[0.15em] text-gray-500"
            >
              {t("password")}
            </label>
            <Link
              href="#"
              className="text-xs font-light text-gray-400 underline underline-offset-4 hover:text-gray-600"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-gray-200 bg-gray-50 px-4 py-6 text-base font-light focus-visible:ring-gray-400"
            required
          />
        </div>

        <Button
          type="submit"
          className="group w-full rounded-xl bg-gray-900 py-6 text-sm font-light tracking-wide hover:bg-gray-800"
          disabled={loading}
        >
          {loading ? "..." : t("submit")}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm font-light text-gray-500">
        {t("noAccount")}{" "}
        <Link
          href={returnUrl ? `/register?returnUrl=${encodeURIComponent(returnUrl)}` : "/register"}
          className="text-gray-700 underline underline-offset-4 hover:text-gray-900"
        >
          {t("register")}
        </Link>
      </p>
    </div>
  );
}
