"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sun,
  Users,
  Zap,
  Leaf,
  TrendingUp,
  ArrowRight,
  Calculator,
} from "lucide-react";

// Constants for calculations
const AVG_SOLAR_PRODUCTION = 1000; // kWh per kWp per year (Swiss average)
const SELF_CONSUMPTION_RATE = 0.6; // 60% consumed locally
const TIMBRE_RATE = 0.08; // 8 ct/kWh network fee
const ENERGY_SAVINGS_RATE = 0.10; // 10 ct/kWh price differential
const CO2_PER_KWH = 0.00012; // tonnes CO2 per kWh

// Pricing tiers
const PRICING_TIERS = {
  starter: { ratePerKwh: 0.010, minimum: 79, label: "Starter" },
  standard: { ratePerKwh: 0.015, minimum: 149, label: "Standard" },
  premium: { ratePerKwh: 0.020, minimum: 249, label: "Premium" },
} as const;

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("fr-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return num.toLocaleString("fr-CH");
}

interface ProjectionResult {
  annualProduction: number;
  energyExchanged: number;
  timbreSavings: number;
  energySavings: number;
  totalSavings: number;
  kiwattCost: number;
  netBenefit: number;
  co2Avoided: number;
  roi: number;
}

function calculateProjection(
  solarCapacity: number,
  sameTransformer: boolean,
  tier: keyof typeof PRICING_TIERS
): ProjectionResult {
  const annualProduction = solarCapacity * AVG_SOLAR_PRODUCTION;
  const energyExchanged = annualProduction * SELF_CONSUMPTION_RATE;
  const timbreDiscount = sameTransformer ? 0.40 : 0.20;
  const timbreSavings = energyExchanged * TIMBRE_RATE * timbreDiscount;
  const energySavings = energyExchanged * ENERGY_SAVINGS_RATE;
  const totalSavings = timbreSavings + energySavings;
  const co2Avoided = energyExchanged * CO2_PER_KWH;

  const monthlyKwh = energyExchanged / 12;
  const tierPricing = PRICING_TIERS[tier];
  const kiwattCost =
    Math.max(monthlyKwh * tierPricing.ratePerKwh, tierPricing.minimum) * 12;
  const netBenefit = totalSavings - kiwattCost;
  const roi = kiwattCost > 0 ? (netBenefit / kiwattCost) * 100 : 0;

  return {
    annualProduction,
    energyExchanged,
    timbreSavings,
    energySavings,
    totalSavings,
    kiwattCost,
    netBenefit,
    co2Avoided,
    roi,
  };
}

export function ProjectionCalculator() {
  const t = useTranslations("calculator");

  // Form state
  const [prosumers, setProsumers] = useState(10);
  const [consumers, setConsumers] = useState(10);
  const [solarCapacity, setSolarCapacity] = useState(100);
  const [sameTransformer, setSameTransformer] = useState(true);
  const [selectedTier, setSelectedTier] =
    useState<keyof typeof PRICING_TIERS>("starter");

  // Calculate results
  const results = calculateProjection(solarCapacity, sameTransformer, selectedTier);

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-12">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Input Form */}
        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <Calculator className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-light text-gray-900">
                {t("inputTitle")}
              </h2>
              <p className="text-sm font-light text-gray-500">
                {t("inputSubtitle")}
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {/* Members */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="flex items-center gap-2 text-sm font-light text-gray-600">
                  <Sun className="h-4 w-4 text-amber-500" />
                  {t("prosumers")}
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={prosumers}
                  onChange={(e) => setProsumers(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-light focus:border-gray-400 focus:outline-none"
                />
                <p className="mt-1 text-xs font-light text-gray-400">
                  {t("prosumersHelp")}
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-light text-gray-600">
                  <Users className="h-4 w-4 text-blue-500" />
                  {t("consumers")}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={consumers}
                  onChange={(e) => setConsumers(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-lg font-light focus:border-gray-400 focus:outline-none"
                />
                <p className="mt-1 text-xs font-light text-gray-400">
                  {t("consumersHelp")}
                </p>
              </div>
            </div>

            {/* Solar Capacity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-light text-gray-600">
                <Zap className="h-4 w-4 text-yellow-500" />
                {t("solarCapacity")}
              </label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={solarCapacity}
                  onChange={(e) => setSolarCapacity(Number(e.target.value))}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-100 accent-gray-900"
                />
                <span className="w-24 text-right text-lg font-light text-gray-900">
                  {solarCapacity} kWp
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs font-light text-gray-400">
                <span>10 kWp</span>
                <span>250 kWp</span>
                <span>500 kWp</span>
              </div>
            </div>

            {/* Transformer */}
            <div>
              <label className="text-sm font-light text-gray-600">
                {t("transformer")}
              </label>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setSameTransformer(true)}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                    sameTransformer
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-lg font-light text-gray-900">40%</p>
                  <p className="mt-1 text-xs font-light text-gray-500">
                    {t("sameTransformer")}
                  </p>
                </button>
                <button
                  onClick={() => setSameTransformer(false)}
                  className={`rounded-xl border-2 px-4 py-4 text-left transition-all ${
                    !sameTransformer
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-lg font-light text-gray-900">20%</p>
                  <p className="mt-1 text-xs font-light text-gray-500">
                    {t("multipleTransformers")}
                  </p>
                </button>
              </div>
            </div>

            {/* Pricing Tier */}
            <div>
              <label className="text-sm font-light text-gray-600">
                {t("pricingTier")}
              </label>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {(Object.keys(PRICING_TIERS) as Array<keyof typeof PRICING_TIERS>).map(
                  (tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`rounded-xl border-2 px-3 py-3 text-center transition-all ${
                        selectedTier === tier
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {tier}
                      </p>
                      <p className="mt-1 text-xs font-light text-gray-500">
                        {PRICING_TIERS[tier].ratePerKwh * 100} ct/kWh
                      </p>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {/* Main Result Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8">
            <h2 className="text-xl font-light text-gray-900">
              {t("resultsTitle")}
            </h2>
            <p className="mt-1 text-sm font-light text-gray-500">
              {prosumers + consumers} {t("members")} • {solarCapacity} kWp
            </p>

            <div className="mt-8 space-y-4">
              {/* Energy Exchanged */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <span className="text-sm font-light text-gray-600">
                  {t("energyExchanged")}
                </span>
                <span className="text-lg font-light text-gray-900">
                  {formatNumber(Math.round(results.energyExchanged))} kWh/an
                </span>
              </div>

              {/* Timbre Savings */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-light text-gray-600">
                  {t("timbreSavings")}
                </span>
                <span className="text-lg font-light text-emerald-600">
                  + {formatCurrency(results.timbreSavings)}
                </span>
              </div>

              {/* Energy Savings */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-light text-gray-600">
                  {t("energySavings")}
                </span>
                <span className="text-lg font-light text-emerald-600">
                  + {formatCurrency(results.energySavings)}
                </span>
              </div>

              {/* Total Savings */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-sm font-medium text-gray-900">
                  {t("totalSavings")}
                </span>
                <span className="text-xl font-light text-emerald-600">
                  + {formatCurrency(results.totalSavings)}
                </span>
              </div>

              {/* Kiwatt Cost */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-light text-gray-600">
                  {t("kiwattCost")}
                </span>
                <span className="text-lg font-light text-gray-500">
                  - {formatCurrency(results.kiwattCost)}
                </span>
              </div>

              {/* Net Benefit */}
              <div className="flex items-center justify-between rounded-xl bg-gray-900 p-4">
                <span className="text-sm font-medium text-white">
                  {t("netBenefit")}
                </span>
                <span className="text-2xl font-light text-white">
                  {formatCurrency(results.netBenefit)}/an
                </span>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-light text-gray-500">
                <TrendingUp className="h-4 w-4" />
                ROI
              </div>
              <p className="mt-2 text-3xl font-light text-gray-900">
                {Math.round(results.roi)}%
              </p>
              <p className="mt-1 text-xs font-light text-gray-400">
                {t("roiHelp")}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="flex items-center gap-2 text-sm font-light text-gray-500">
                <Leaf className="h-4 w-4 text-green-500" />
                CO₂ {t("avoided")}
              </div>
              <p className="mt-2 text-3xl font-light text-gray-900">
                {results.co2Avoided.toFixed(1)}t
              </p>
              <p className="mt-1 text-xs font-light text-gray-400">
                {t("co2Help")}
              </p>
            </div>
          </div>

          {/* CTA */}
          <a
            href={`mailto:info@kiwatt.ch?subject=${encodeURIComponent(t("emailSubject"))}&body=${encodeURIComponent(
              t("emailBody", {
                members: prosumers + consumers,
                solarCapacity,
                savings: formatCurrency(results.netBenefit),
              })
            )}`}
            className="group flex items-center justify-center gap-3 rounded-xl bg-gray-900 py-4 text-white transition-colors hover:bg-gray-800"
          >
            {t("cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>

          <p className="text-center text-xs font-light text-gray-400">
            {t("disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
