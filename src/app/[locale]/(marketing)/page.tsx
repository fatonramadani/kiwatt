import { setRequestLocale } from "next-intl/server";
import { HeroSection } from "~/components/marketing/sections/hero";
import { ProblemSection } from "~/components/marketing/sections/problem";
import { FeaturesSection } from "~/components/marketing/sections/features";
import { AllFeaturesSection } from "~/components/marketing/sections/all-features";
import { HowItWorksSection } from "~/components/marketing/sections/how-it-works";
import { PricingSection } from "~/components/marketing/sections/pricing";
import { ServicesSection } from "~/components/marketing/sections/services";
import { FAQSection } from "~/components/marketing/sections/faq";
import { TrustSection } from "~/components/marketing/sections/trust";
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
      <ProblemSection />
      <AllFeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <ServicesSection />
      <FAQSection />
      <TrustSection />
      <CTASection />
    </>
  );
}
