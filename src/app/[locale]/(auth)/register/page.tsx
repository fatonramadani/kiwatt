"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { authClient } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message ?? "Registration failed");
      } else {
        router.push("/app");
        router.refresh();
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-light uppercase tracking-[0.3em] text-pelorous-500">
        Get started
      </p>
      <h2 className="mt-4 text-3xl font-light tracking-tight text-pelorous-950">
        {t("title")}
      </h2>
      <p className="mt-2 text-sm font-light text-pelorous-600">{t("subtitle")}</p>

      <form onSubmit={onSubmit} className="mt-12 space-y-6">
        {error && (
          <div className="border border-red-200 bg-red-50 p-4 text-sm font-light text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="name"
            className="text-xs font-light uppercase tracking-[0.15em] text-pelorous-600"
          >
            {t("name")}
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jean Dupont"
            className="rounded-none border-pelorous-200 bg-white px-4 py-6 text-base font-light focus-visible:ring-pelorous-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-light uppercase tracking-[0.15em] text-pelorous-600"
          >
            {t("email")}
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nom@exemple.ch"
            className="rounded-none border-pelorous-200 bg-white px-4 py-6 text-base font-light focus-visible:ring-pelorous-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-xs font-light uppercase tracking-[0.15em] text-pelorous-600"
          >
            {t("password")}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-none border-pelorous-200 bg-white px-4 py-6 text-base font-light focus-visible:ring-pelorous-500"
            required
          />
        </div>

        <Button
          type="submit"
          className="group w-full rounded-none bg-pelorous-950 py-6 text-sm font-light tracking-wide hover:bg-pelorous-800"
          disabled={loading}
        >
          {loading ? "..." : t("submit")}
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>

      <p className="mt-12 text-center text-sm font-light text-pelorous-600">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-pelorous-700 underline underline-offset-4 hover:text-pelorous-950"
        >
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
