"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Calculator,
  Info,
} from "lucide-react";
import { cn } from "~/lib/utils";

interface PricingGuideProps {
  timbreReduction: "20" | "40";
  onApplyRates?: (rates: {
    communityRate: number;
    gridRate: number;
    injectionRate: number;
  }) => void;
  className?: string;
}

export function PricingGuide({
  timbreReduction,
  onApplyRates,
  className,
}: PricingGuideProps) {
  const t = useTranslations("settings.tariffs.pricingGuide");
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  // Calculator state
  const [gridRate, setGridRate] = useState(0.25);
  const [margin, setMargin] = useState(0.01);

  // Timbre portion of grid rate (network fees are typically ~10 ct/kWh in Switzerland)
  const timbrePortion = 0.1;
  const timbreReductionPercent = parseInt(timbreReduction) / 100;
  const timbreSavings = timbrePortion * timbreReductionPercent;

  // Calculate suggested rates
  const suggestedCommunityRate = Math.max(
    0,
    gridRate - timbreSavings + margin
  );
  const memberSavings = Math.max(0, gridRate - suggestedCommunityRate);
  const suggestedInjectionRate = Math.max(0, suggestedCommunityRate * 0.5); // ~50% of community rate

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat(`${locale}-CH`, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(rate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(`${locale}-CH`, {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const handleApplyRates = () => {
    onApplyRates?.({
      communityRate: suggestedCommunityRate,
      gridRate: gridRate,
      injectionRate: suggestedInjectionRate,
    });
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-pelorous-100 bg-pelorous-50/30",
        className
      )}
    >
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4"
      >
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-pelorous-500" />
          <span className="font-medium text-gray-900">{t("title")}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="space-y-6 border-t border-pelorous-100 px-6 py-6">
          {/* Formula Section */}
          <div className="rounded-xl bg-white p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Calculator className="h-4 w-4 text-pelorous-500" />
              {t("formulaTitle")}
            </h4>
            <div className="mt-3 rounded-lg bg-gray-50 p-3">
              <code className="text-sm text-gray-700">{t("formula")}</code>
            </div>
            <p className="mt-3 text-xs text-gray-500">{t("formulaHelp")}</p>
          </div>

          {/* Calculator Section */}
          <div className="rounded-xl bg-white p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <Calculator className="h-4 w-4 text-pelorous-500" />
              {t("calculator")}
            </h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* Grid Rate Input */}
              <div>
                <label className="block text-xs text-gray-500">
                  {t("gridRate")}
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={gridRate}
                    onChange={(e) =>
                      setGridRate(parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-16 text-sm focus:border-pelorous-300 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    CHF/kWh
                  </span>
                </div>
              </div>

              {/* Margin Input */}
              <div>
                <label className="block text-xs text-gray-500">
                  {t("margin")}
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={margin}
                    onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-16 text-sm focus:border-pelorous-300 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    CHF/kWh
                  </span>
                </div>
              </div>
            </div>

            {/* Timbre Info */}
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-pelorous-50 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-pelorous-500" />
              <div className="text-xs text-pelorous-700">
                <span className="font-medium">
                  {t("timbreReduction")}: {timbreReduction}%
                </span>
                <span className="mx-1">-</span>
                <span>
                  {t("timbreSavings")}: {formatRate(timbreSavings)} CHF/kWh
                </span>
              </div>
            </div>

            {/* Results */}
            <div className="mt-4 space-y-3 rounded-lg border border-pelorous-200 bg-pelorous-50/50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("suggestedRate")}:</span>
                <span className="font-medium text-pelorous-700">
                  {formatRate(suggestedCommunityRate)} CHF/kWh
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("suggestedInjection")}:</span>
                <span className="font-medium text-gray-700">
                  {formatRate(suggestedInjectionRate)} CHF/kWh
                </span>
              </div>
              <div className="flex justify-between border-t border-pelorous-200 pt-3 text-sm">
                <span className="text-gray-600">{t("memberSavings")}:</span>
                <span className="font-medium text-emerald-600">
                  {formatRate(memberSavings)} CHF/kWh
                </span>
              </div>
            </div>

            {/* Apply Button */}
            {onApplyRates && (
              <button
                type="button"
                onClick={handleApplyRates}
                className="mt-4 w-full rounded-xl bg-pelorous-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pelorous-700"
              >
                {t("applyRates")}
              </button>
            )}
          </div>

          {/* Margin Info */}
          <div className="rounded-xl bg-amber-50 p-4">
            <h4 className="flex items-center gap-2 text-sm font-medium text-amber-800">
              <Info className="h-4 w-4 text-amber-500" />
              {t("marginInfoTitle")}
            </h4>
            <ul className="mt-2 space-y-1 text-xs text-amber-700">
              <li>{t("marginInfo1")}</li>
              <li>{t("marginInfo2")}</li>
              <li>{t("marginInfo3")}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
