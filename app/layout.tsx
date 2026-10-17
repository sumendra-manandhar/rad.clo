import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque, Poppins } from "next/font/google";
import "./globals.css";
import { textFontVariables } from "./fonts/text-fonts";
import { SITE } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"], variable: "--font-poppins" });

// App-like on phones: fills the screen edge to edge (safe areas are padded
// in the layout) and tints the browser bar to match the page.
export const viewport: Viewport = {
  themeColor: "#eef2f7",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  appleWebApp: { capable: true, title: "Rad.Clo", statusBarStyle: "default" },
  title: { default: SITE.title, template: "%s | Rad.Clo Nepal" },
  description: SITE.description,
  keywords: SITE.keywords,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_NP",
    title: SITE.title,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image", title: SITE.title, description: SITE.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  // From Google Search Console → Add property → HTML tag
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
  other: { "geo.region": "NP", "geo.placename": "Kathmandu" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${poppins.variable} ${textFontVariables}`}>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
