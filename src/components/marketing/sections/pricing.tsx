"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "~/i18n/navigation";
import { Button } from "~/components/ui/button";
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
          <p className="mb-4 flex items-center gap-3 text-sm font-light uppercase tracking-[0.3em] text-pelorous-500">
            <span className="h-px w-8 bg-pelorous-500" />
            {t("label")}
          </p>
          <h2 className="text-4xl font-light leading-tight tracking-tight text-pelorous-950 lg:text-5xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg font-light text-pelorous-600">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-16 lg:grid-cols-2">
          {/* Pricing calculator */}
          <div className="border border-pelorous-200 bg-white p-10">
            <h3 className="text-xl font-light text-pelorous-950">
              {t("calculator.title")}
            </h3>
            <p className="mt-2 text-sm font-light text-pelorous-600">
              {t("calculator.subtitle")}
            </p>

            {/* Volume slider */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <label className="text-xs font-light uppercase tracking-[0.15em] text-pelorous-600">
                  {t("calculator.volume")}
                </label>
                <span className="text-lg font-light text-pelorous-950">
                  {formatNumber(volume)} <span className="text-pelorous-500">kWh/mois</span>
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="300000"
                step="5000"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-none bg-pelorous-100 accent-pelorous-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-pelorous-500"
              />
              <div className="mt-2 flex justify-between text-xs font-light text-pelorous-400">
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
                  className={`px-4 py-2 text-xs font-light transition-colors ${
                    volume === tier.volume
                      ? "bg-pelorous-500 text-white"
                      : "bg-pelorous-50 text-pelorous-700 hover:bg-pelorous-100"
                  }`}
                >
                  {tier.label} kWh
                </button>
              ))}
            </div>

            {/* Price display */}
            <div className="mt-10 border-t border-pelorous-200 pt-10">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-light uppercase tracking-[0.15em] text-pelorous-500">
                    {t("calculator.monthly")}
                  </p>
                  <p className="mt-2 text-4xl font-light text-pelorous-950">
                    CHF {formatNumber(Math.round(monthlyPrice))}
                    <span className="text-lg text-pelorous-500">/mois</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-light uppercase tracking-[0.15em] text-pelorous-500">
                    {t("calculator.annual")}
                  </p>
                  <p className="mt-2 text-2xl font-light text-pelorous-700">
                    CHF {formatNumber(Math.round(annualPrice))}/an
                  </p>
                </div>
              </div>

              {volume <= 10000 && (
                <p className="mt-4 text-sm font-light text-pelorous-500">
                  {t("calculator.minimum")}
                </p>
              )}
            </div>

            {/* Formula */}
            <div className="mt-8 flex items-center gap-2 rounded bg-pelorous-50 p-4 text-sm font-light text-pelorous-700">
              <Zap className="h-4 w-4 text-pelorous-500" />
              {t("formula")}
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-light text-pelorous-950">
                {t("included.title")}
              </h3>
              <p className="mt-2 text-sm font-light text-pelorous-600">
                {t("included.subtitle")}
              </p>

              <ul className="mt-10 space-y-5">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-4 text-sm font-light text-pelorous-700"
                  >
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-pelorous-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/register" className="mt-12">
              <Button className="group w-full rounded-none bg-pelorous-950 py-6 text-sm font-light tracking-wide hover:bg-pelorous-800">
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Example tiers */}
        <div className="mt-20 border-t border-pelorous-200 pt-12">
          <p className="text-sm font-light uppercase tracking-[0.2em] text-pelorous-500">
            {t("examples.title")}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier) => {
              const price = calculatePrice(tier.volume);
              return (
                <div
                  key={tier.volume}
                  className="border border-pelorous-200 p-6 transition-colors hover:border-pelorous-400"
                >
                  <p className="text-xs font-light uppercase tracking-wider text-pelorous-500">
                    {tier.example}
                  </p>
                  <p className="mt-2 text-2xl font-light text-pelorous-950">
                    {formatNumber(tier.volume)} <span className="text-sm text-pelorous-500">kWh</span>
                  </p>
                  <p className="mt-4 text-lg font-light text-pelorous-700">
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
