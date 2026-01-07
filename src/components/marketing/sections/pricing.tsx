"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { ArrowRight, Check, Zap } from "lucide-react";

const PRICE_PER_KWH = 0.005;
const MIN_PRICE = 49;

function calculatePrice(volumeKwh: number): number {
  const calculated = volumeKwh * PRICE_PER_KWH;
  return Math.max(calculated, MIN_PRICE);
}

function formatNumber(num: number): string {
  return num.toLocaleString("fr-CH");
}

export function PricingSection() {
  const t = useTranslations("landing.pricing");
  const [volume, setVolume] = useState(50000); // 50,000 kWh/month default

  const monthlyPrice = calculatePrice(volume);
  const annualPrice = monthlyPrice * 12;

  const tiers = [
    { volume: 10000, label: "10k", example: t("tiers.small") },
    { volume: 50000, label: "50k", example: t("tiers.medium") },
    { volume: 100000, label: "100k", example: t("tiers.large") },
    { volume: 200000, label: "200k", example: t("tiers.enterprise") },
  ];

  const features = t.raw("features") as string[];

  return (
    <section id="pricing" className="bg-white py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-20 max-w-xl">
          <p className="mb-4 flex items-center gap-3 text-sm font-light uppercase tracking-[0.3em] text-gray-400">
            <span className="h-px w-8 bg-gray-300" />
            {t("label")}
          </p>
          <h2 className="text-4xl font-light leading-tight tracking-tight text-gray-900 lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg font-light text-gray-500">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2">
          {/* Pricing calculator */}
          <div className="rounded-2xl border border-gray-100 bg-white p-10">
            <h3 className="text-xl font-light text-gray-900">
              {t("calculator.title")}
            </h3>
            <p className="mt-2 text-sm font-light text-gray-500">
              {t("calculator.subtitle")}
            </p>

            {/* Volume slider */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-light uppercase tracking-[0.15em] text-gray-500">
                  {t("calculator.volume")}
                </label>
                <span className="text-lg font-light text-gray-900">
                  {formatNumber(volume)} <span className="text-gray-400">kWh/mois</span>
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="300000"
                step="5000"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-gray-100 accent-gray-900 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gray-900"
              />
              <div className="mt-2 flex justify-between text-xs font-light text-gray-400">
                <span>5k</span>
                <span>100k</span>
                <span>200k</span>
                <span>300k</span>
              </div>
            </div>

            {/* Quick select */}
            <div className="mt-8 flex flex-wrap gap-2">
              {tiers.map((tier) => (
                <button
                  key={tier.volume}
                  onClick={() => setVolume(tier.volume)}
                  className={`rounded-xl px-4 py-2 text-xs font-light transition-colors ${
                    volume === tier.volume
                      ? "bg-gray-900 text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tier.label} kWh
                </button>
              ))}
            </div>

            {/* Price display */}
            <div className="mt-10 border-t border-gray-100 pt-10">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-light uppercase tracking-[0.15em] text-gray-400">
                    {t("calculator.monthly")}
                  </p>
                  <p className="mt-2 text-4xl font-light text-gray-900">
                    CHF {formatNumber(Math.round(monthlyPrice))}
                    <span className="text-lg text-gray-400">/mois</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-light uppercase tracking-[0.15em] text-gray-400">
                    {t("calculator.annual")}
                  </p>
                  <p className="mt-2 text-2xl font-light text-gray-500">
                    CHF {formatNumber(Math.round(annualPrice))}/an
                  </p>
                </div>
              </div>

              {volume <= 10000 && (
                <p className="mt-4 text-sm font-light text-gray-400">
                  {t("calculator.minimum")}
                </p>
              )}
            </div>

            {/* Formula */}
            <div className="mt-8 flex items-center gap-2 rounded-xl bg-gray-50 p-4 text-sm font-light text-gray-600">
              <Zap className="h-4 w-4 text-gray-400" />
              {t("formula")}
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-light text-gray-900">
                {t("included.title")}
              </h3>
              <p className="mt-2 text-sm font-light text-gray-500">
                {t("included.subtitle")}
              </p>

              <ul className="mt-10 space-y-5">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-4 text-sm font-light text-gray-600"
                  >
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href="/register"
              className="group mt-12 flex items-center justify-center gap-2 rounded-xl bg-gray-900 py-4 text-sm font-light tracking-wide text-white transition-colors hover:bg-gray-800"
            >
              {t("cta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Example tiers */}
        <div className="mt-20 border-t border-gray-100 pt-12">
          <p className="text-sm font-light uppercase tracking-[0.2em] text-gray-400">
            {t("examples.title")}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const price = calculatePrice(tier.volume);
              return (
                <div
                  key={tier.volume}
                  className="rounded-2xl border border-gray-100 p-6 transition-colors hover:border-gray-200"
                >
                  <p className="text-xs font-light uppercase tracking-wider text-gray-400">
                    {tier.example}
                  </p>
                  <p className="mt-2 text-2xl font-light text-gray-900">
                    {formatNumber(tier.volume)} <span className="text-sm text-gray-400">kWh</span>
                  </p>
                  <p className="mt-4 text-lg font-light text-gray-600">
                    CHF {formatNumber(Math.round(price))}<span className="text-sm">/mois</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
