"use client";

import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Mail, Sparkles } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("auth.register");

  return (
    <div className="rounded-2xl bg-white p-10 shadow-sm">
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
        <Sparkles className="h-6 w-6 text-teal-600" />
      </div>

      <p className="text-sm font-light uppercase tracking-[0.3em] text-gray-400">
        {t("alphaTagline")}
      </p>
      <h2 className="mt-4 text-3xl font-light tracking-tight text-gray-900">
        {t("alphaTitle")}
      </h2>
      <p className="mt-4 text-base font-light leading-relaxed text-gray-500">
        {t("alphaDescription")}
      </p>

      <div className="mt-8 rounded-xl border border-teal-100 bg-teal-50/50 p-6">
        <p className="text-sm font-medium text-teal-900">
          {t("alphaContact")}
        </p>
        <a
          href="mailto:info@kiwatt.ch?subject=Demande d'accès au programme Alpha Kiwatt"
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-light text-white transition-colors hover:bg-teal-700"
        >
          <Mail className="h-4 w-4" />
          info@kiwatt.ch
        </a>
      </div>

      <p className="mt-8 text-center text-sm font-light text-gray-500">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="text-gray-700 underline underline-offset-4 hover:text-gray-900"
        >
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
