import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Kiwatt - Gestion CEL",
  description:
    "La solution de gestion pour les communautes electriques locales en Suisse",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${geist.variable}`} suppressHydrationWarning>
      <Analytics />
      <body>{children}</body>
    </html>
  );
}
