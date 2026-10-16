// Fonts for the studio's text tool. Not preloaded: the browser only downloads
// a font when a customer picks it. Each exposes a CSS variable that
// lib/text-art.ts reads to draw text onto the print.
import {
  Anton,
  Bebas_Neue,
  Black_Ops_One,
  Bungee,
  Dancing_Script,
  Fredoka,
  Graduate,
  Great_Vibes,
  Kalam,
  Mukta,
  Pacifico,
  Permanent_Marker,
  Rozha_One,
} from "next/font/google";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-t-anton", preload: false, display: "swap" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-t-bebas", preload: false, display: "swap" });
const blackOps = Black_Ops_One({ subsets: ["latin"], weight: "400", variable: "--font-t-blackops", preload: false, display: "swap" });
const bungee = Bungee({ subsets: ["latin"], weight: "400", variable: "--font-t-bungee", preload: false, display: "swap" });
const dancing = Dancing_Script({ subsets: ["latin"], weight: "700", variable: "--font-t-dancing", preload: false, display: "swap" });
const fredoka = Fredoka({ subsets: ["latin"], weight: "700", variable: "--font-t-fredoka", preload: false, display: "swap" });
const graduate = Graduate({ subsets: ["latin"], weight: "400", variable: "--font-t-graduate", preload: false, display: "swap" });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-t-greatvibes", preload: false, display: "swap" });
const kalam = Kalam({ subsets: ["latin", "devanagari"], weight: "700", variable: "--font-t-kalam", preload: false, display: "swap" });
const mukta = Mukta({ subsets: ["latin", "devanagari"], weight: "800", variable: "--font-t-mukta", preload: false, display: "swap" });
const pacifico = Pacifico({ subsets: ["latin"], weight: "400", variable: "--font-t-pacifico", preload: false, display: "swap" });
const marker = Permanent_Marker({ subsets: ["latin"], weight: "400", variable: "--font-t-marker", preload: false, display: "swap" });
const rozha = Rozha_One({ subsets: ["latin", "devanagari"], weight: "400", variable: "--font-t-rozha", preload: false, display: "swap" });

/** Class names that define every text-tool font variable (put on <html>). */
export const textFontVariables = [
  anton,
  bebas,
  blackOps,
  bungee,
  dancing,
  fredoka,
  graduate,
  greatVibes,
  kalam,
  mukta,
  pacifico,
  marker,
  rozha,
]
  .map((f) => f.variable)
  .join(" ");
