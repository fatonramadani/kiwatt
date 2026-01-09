import { MarketingHeader } from "~/components/marketing/header";
import { MarketingFooter } from "~/components/marketing/footer";
import { CookieBanner } from "~/components/cookie-banner";
import { AnnouncementBar } from "~/components/marketing/announcement-bar";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <MarketingHeader />
      <main className="flex-1 pt-[calc(var(--announcement-height,0px))]">{children}</main>
      <MarketingFooter />
      <CookieBanner />
    </div>
  );
}
