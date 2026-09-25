import type { Metadata } from "next";
import { JetBrains_Mono, League_Gothic, Newsreader } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/experience/smooth-scroll";

const display = League_Gothic({ variable: "--font-league-gothic", weight: "400", subsets: ["latin"], display: "swap" });
const serif = Newsreader({ variable: "--font-newsreader", style: ["normal", "italic"], subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-jetbrains-mono", weight: ["400", "500"], subsets: ["latin", "greek"], display: "swap" });

const description =
  "Forward Deployed AI Engineer. I deploy agentic systems inside the customer — working POC in two weeks, live beta inside five months.";

export const metadata: Metadata = {
  metadataBase: new URL("https://bhumil-modi-portfolio.vercel.app"),
  title: "Bhumil Modi — Forward Deployed AI Engineer",
  description,
  openGraph: { title: "Bhumil Modi — Forward Deployed AI Engineer", description, type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
