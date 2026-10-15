import type { Category, Design } from "@/lib/types";

// First-run content for the local store. Edit everything from /admin after that.

const t = (minutesAgo: number) => new Date(Date.UTC(2026, 0, 1) - minutesAgo * 60_000).toISOString();

export const SEED_CATEGORIES: Category[] = [
  { id: "cat-typography", name: "Typography", slug: "typography", description: "Bold words and statements", sort: 1, createdAt: t(0) },
  { id: "cat-streetwear", name: "Streetwear", slug: "streetwear", description: "Loud graphics for the streets", sort: 2, createdAt: t(0) },
  { id: "cat-minimal", name: "Minimal", slug: "minimal", description: "Clean lines, quiet confidence", sort: 3, createdAt: t(0) },
  { id: "cat-nature", name: "Nature", slug: "nature", description: "Mountains, sun and flowers", sort: 4, createdAt: t(0) },
  { id: "cat-doodle", name: "Doodle", slug: "doodle", description: "Playful hand-drawn art", sort: 5, createdAt: t(0) },
];

const d = (
  n: number,
  name: string,
  slug: string,
  category: string,
  price: number,
  featured = false
): Design => ({
  id: `seed-${slug}`,
  name,
  slug,
  category,
  price,
  image: `/designs/${slug}.jpg`,
  featured,
  active: true,
  createdAt: t(n),
});

export const SEED_DESIGNS: Design[] = [
  d(1, "Stay Hungry", "typo-hustle", "typography", 199, true),
  d(2, "Good Vibes Only", "typo-vibes", "typography", 199, true),
  d(3, "Forward Arrow", "arrow-mono", "typography", 149),
  d(4, "Street Skull", "skull-street", "streetwear", 249, true),
  d(5, "Lightning Bolt", "lightning-bolt", "streetwear", 199),
  d(6, "Tiger Face", "tiger-face", "streetwear", 249, true),
  d(7, "Mountain Line", "mountain-line", "minimal", 179, true),
  d(8, "Abstract Wave", "wave-abstract", "minimal", 179),
  d(9, "Peace Sign", "peace-sign", "minimal", 149),
  d(10, "Sun Rays", "sun-rays", "nature", 179, true),
  d(11, "Line Flower", "flower-line", "nature", 179),
  d(12, "Cat Doodle", "cat-doodle", "doodle", 199, true),
];
