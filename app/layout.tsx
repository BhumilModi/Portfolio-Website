import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JetBrains_Mono, League_Gothic, Newsreader } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/experience/smooth-scroll";
import StageLoader from "@/components/experience/stage-loader";
import Crossing from "@/components/quest/crossing";
import { SoundSync } from "@/components/quest/sound";
import { SITE } from "@/lib/content";

const display = League_Gothic({ variable: "--font-league-gothic", weight: "400", subsets: ["latin"], display: "swap" });
const serif = Newsreader({ variable: "--font-newsreader", style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains-mono", weight: ["400", "500"], subsets: ["latin", "greek"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name} — ${SITE.role}`,
  description: SITE.description,
  openGraph: { title: `${SITE.name} — ${SITE.role}`, description: SITE.description, type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll />
        <SoundSync />
        <StageLoader />
        {children}
        <Crossing />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
