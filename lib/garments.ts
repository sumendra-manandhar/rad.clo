import type { Settings } from "@/lib/types";
import { PRINT_LOCATIONS } from "@/lib/print-locations";

export type Garment = {
  slug: string;
  label: string;
  basePrice: number;
  fabric: string;
  image: string;
};

export const GARMENTS: Garment[] = [
  {
    slug: "oversized-tee",
    label: "Oversized Tee",
    basePrice: 649,
    fabric: "240 GSM heavyweight cotton, drop shoulder",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
  },
  {
    slug: "classic-tee",
    label: "Classic Tee",
    basePrice: 449,
    fabric: "180 GSM combed cotton, regular fit",
    image:
      "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=800&auto=format&fit=crop",
  },
  {
    slug: "polo",
    label: "Polo",
    basePrice: 749,
    fabric: "220 GSM pique knit",
    image:
      "https://images.unsplash.com/photo-1626497764746-6dc36546b388?q=80&w=800&auto=format&fit=crop",
  },
  {
    slug: "hoodie",
    label: "Hoodie",
    basePrice: 1249,
    fabric: "320 GSM brushed fleece",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
  },
  {
    slug: "sweatshirt",
    label: "Sweatshirt",
    basePrice: 1049,
    fabric: "300 GSM loopknit cotton",
    image:
      "https://images.unsplash.com/photo-1614251055880-ee96e4803393?q=80&w=800&auto=format&fit=crop",
  },
];

export const COLORS = [
  { hex: "#ffffff", label: "White" },
  { hex: "#1f1f1f", label: "Black" },
  { hex: "#6F7573", label: "Charcoal" },
  { hex: "#1E334D", label: "Navy" },
  { hex: "#476748", label: "Olive" },
  { hex: "#662735", label: "Maroon" },
  { hex: "#d9c7a7", label: "Sand" },
];

export const SIZES = ["S", "M", "L", "XL", "2XL"];

// Delivery inside Nepal
export const FREE_SHIPPING_FROM = 2000;
export const SHIPPING_FEE = 100;

export function shippingFor(subtotal: number) {
  return subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
}

export function getGarment(slug?: string | null) {
  return GARMENTS.find((g) => g.slug === slug) ?? GARMENTS[0];
}

export function colorLabel(hex: string) {
  return COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.label ?? "Custom";
}

/** Nepali rupees, with lakh grouping (Rs. 1,00,000) as used in Nepal */
export function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

/**
 * The live catalogue: admin settings merged over the defaults in code.
 * Passed from server pages to client components, so everything that lists
 * garments or print areas shows only what the admin has enabled.
 */
export type Pricing = {
  garment: Record<string, number>;
  location: Record<string, number>;
  hiddenGarments: string[];
  hiddenLocations: string[];
  garmentInfo: Record<string, { label: string; fabric: string; image: string }>;
};

export function resolvePricing(settings?: Partial<Settings> | null): Pricing {
  const garment: Record<string, number> = {};
  const garmentInfo: Pricing["garmentInfo"] = {};
  for (const g of GARMENTS) {
    garment[g.slug] = settings?.garmentPrices?.[g.slug] ?? g.basePrice;
    const o = settings?.garmentInfo?.[g.slug];
    garmentInfo[g.slug] = { label: o?.label || g.label, fabric: o?.fabric || g.fabric, image: o?.image || g.image };
  }
  const location: Record<string, number> = {};
  for (const l of PRINT_LOCATIONS) location[l.id] = settings?.locationPrices?.[l.id] ?? l.defaultPrice;
  const known = (ids: string[] | undefined, all: string[]) => (ids ?? []).filter((id) => all.includes(id));
  return {
    garment,
    location,
    hiddenGarments: known(settings?.hiddenGarments, GARMENTS.map((g) => g.slug)),
    hiddenLocations: known(settings?.hiddenLocations, PRINT_LOCATIONS.map((l) => l.id)),
    garmentInfo,
  };
}

/** Every garment with admin overrides applied, plus whether it's visible. */
export function garmentList(p: Pricing) {
  return GARMENTS.map((g) => ({
    ...g,
    ...p.garmentInfo[g.slug],
    basePrice: p.garment[g.slug],
    visible: !p.hiddenGarments.includes(g.slug),
  }));
}

export function visibleGarments(p: Pricing) {
  return garmentList(p).filter((g) => g.visible);
}

export function visibleLocations(p: Pricing) {
  return PRINT_LOCATIONS.filter((l) => !p.hiddenLocations.includes(l.id));
}

/** A visible garment by slug, falling back to the first visible one. */
export function garmentFor(p: Pricing, slug?: string | null) {
  const list = visibleGarments(p);
  return list.find((g) => g.slug === slug) ?? list[0] ?? garmentList(p)[0];
}

/** Cheapest way to buy a store design: cheapest visible garment + print area. */
export function designFromPrice(designPrice: number, p: Pricing) {
  const g = visibleGarments(p).map((x) => x.basePrice);
  const l = visibleLocations(p).map((x) => p.location[x.id]);
  return (g.length ? Math.min(...g) : 0) + (l.length ? Math.min(...l) : 0) + designPrice;
}
