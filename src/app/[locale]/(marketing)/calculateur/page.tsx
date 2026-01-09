import { useTranslations } from "next-intl";
import { ProjectionCalculator } from "~/components/marketing/sections/projection-calculator";

export default function CalculateurPage() {
  const t = useTranslations("calculator");

  return (
    <div className="bg-gray-50 py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <p className="mb-4 flex items-center gap-3 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            <span className="h-px w-8 bg-gray-300" />
            {t("pageLabel")}
          </p>
          <h1 className="text-4xl font-light leading-tight tracking-tight text-gray-900 lg:text-5xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-4 text-lg font-light text-gray-500">
            {t("pageSubtitle")}
          </p>
        </div>
      </div>

      {/* Calculator Component */}
      <ProjectionCalculator />
    </div>
  );
}
