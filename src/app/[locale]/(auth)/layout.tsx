import { Link } from "~/i18n/navigation";
import { LanguageSwitcher } from "~/components/marketing/language-switcher";
import { getTranslations } from "next-intl/server";
import { DatabaseZap } from "lucide-react";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("auth.branding");

  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 lg:flex lg:flex-col lg:justify-between lg:p-16">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-light tracking-tight text-white"
        >
          <DatabaseZap className="h-6 w-6" strokeWidth={1.5} />
          kiwatt
        </Link>

        <div className="max-w-lg">
          <h1 className="text-4xl leading-tight font-light tracking-tight text-white lg:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-8 text-lg leading-relaxed font-light text-gray-400">
            {t("subtitle")}
          </p>
        </div>

        <p className="text-xs font-light text-gray-600">
          &copy; {new Date().getFullYear()} Kiwatt
        </p>
      </div>

      {/* Right side - form */}
      <div className="relative flex w-full items-center justify-center bg-gray-50 p-8 lg:w-1/2">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-12 lg:hidden">
            <Link
              href="/"
              className="flex items-center gap-2 text-2xl font-light tracking-tight text-gray-900"
            >
              <DatabaseZap className="h-6 w-6" strokeWidth={1.5} />
              kiwatt
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
