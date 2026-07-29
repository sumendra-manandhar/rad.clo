export type Design = {
  id: string;
  name: string;
  category: string;
  src: string;
};

export const DESIGN_CATEGORIES = [
  "Typography",
  "Streetwear",
  "Minimal",
  "Nature",
  "Doodle",
] as const;

export const DESIGNS: Design[] = [
  { id: "d1", name: "Stay Hungry", category: "Typography", src: "/designs/typo-hustle.svg" },
  { id: "d2", name: "Good Vibes Only", category: "Typography", src: "/designs/typo-vibes.svg" },
  { id: "d3", name: "Forward Arrow", category: "Typography", src: "/designs/arrow-mono.svg" },
  { id: "d4", name: "Street Skull", category: "Streetwear", src: "/designs/skull-street.svg" },
  { id: "d5", name: "Lightning Bolt", category: "Streetwear", src: "/designs/lightning-bolt.svg" },
  { id: "d6", name: "Tiger Face", category: "Streetwear", src: "/designs/tiger-face.svg" },
  { id: "d7", name: "Mountain Line", category: "Minimal", src: "/designs/mountain-line.svg" },
  { id: "d8", name: "Abstract Wave", category: "Minimal", src: "/designs/wave-abstract.svg" },
  { id: "d9", name: "Peace Sign", category: "Minimal", src: "/designs/peace-sign.svg" },
  { id: "d10", name: "Sun Rays", category: "Nature", src: "/designs/sun-rays.svg" },
  { id: "d11", name: "Line Flower", category: "Nature", src: "/designs/flower-line.svg" },
  { id: "d12", name: "Cat Doodle", category: "Doodle", src: "/designs/cat-doodle.svg" },
];

export function getDesignsByCategory(category?: string) {
  if (!category || category === "All") return DESIGNS;
  return DESIGNS.filter((d) => d.category === category);
}
