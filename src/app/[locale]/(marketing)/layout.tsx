import { MarketingHeader } from "~/components/marketing/header";
import { MarketingFooter } from "~/components/marketing/footer";
import { CookieBanner } from "~/components/cookie-banner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
      <CookieBanner />
    </div>
  );
}
