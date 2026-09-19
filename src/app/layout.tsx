import type { Metadata } from "next";
import { Archivo, Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

const archivo = Archivo({ subsets: ["latin"], weight: "variable", axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-public", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://flightdelaycheck.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "FlightDelayCheck: is your delayed or cancelled flight owed £220 to £520?", template: "%s | FlightDelayCheck" },
  description: "Check a delayed or cancelled flight against the official flight record, the airport delay data and the weather that day. Free verdict in seconds, then a ready-to-send UK261/EU261 claim letter for £4.99. No percentage fees.",
  openGraph: { type: "website", siteName: "FlightDelayCheck", locale: "en_GB" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${archivo.variable} ${publicSans.variable} ${mono.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
