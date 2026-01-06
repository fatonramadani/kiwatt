import { setRequestLocale } from "next-intl/server";
import { HeroSection } from "~/components/marketing/sections/hero";
import { FeaturesSection } from "~/components/marketing/sections/features";
import { HowItWorksSection } from "~/components/marketing/sections/how-it-works";
import { PricingSection } from "~/components/marketing/sections/pricing";
import { FAQSection } from "~/components/marketing/sections/faq";
import { CTASection } from "~/components/marketing/sections/cta";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
