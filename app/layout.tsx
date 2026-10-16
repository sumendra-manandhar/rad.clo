import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque, Poppins } from "next/font/google";
import "./globals.css";
import { textFontVariables } from "./fonts/text-fonts";

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
  appleWebApp: { capable: true, title: "Rad.Clo", statusBarStyle: "default" },
  title: "Rad.Clo — Custom T-Shirt Printing with Live 3D Preview",
  description:
    "Design custom t-shirts, hoodies and sweatshirts. Pick a print from our design store or upload your own, preview it on a 3D shirt, and order.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable} ${poppins.variable} ${textFontVariables}`}>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
