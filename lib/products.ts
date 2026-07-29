export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  image: string;
  hoverImage?: string;
  colors: string[];
  tag?: string;
};

export const CATEGORIES = [
  { slug: "oversized-tees", label: "Oversized Tees" },
  { slug: "classic-tees", label: "Classic Tees" },
  { slug: "polo", label: "Polo Shirts" },
  { slug: "hoodies", label: "Hoodies" },
  { slug: "sweatshirts", label: "Sweatshirts" },
] as const;

export const PRODUCTS: Product[] = [
  {
    id: "ot-01",
    name: "Drop Shoulder Oversized Tee",
    category: "oversized-tees",
    price: 799,
    compareAt: 999,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    hoverImage:
      "https://images.unsplash.com/photo-1622445275576-721325763afe?q=80&w=800&auto=format&fit=crop",
    colors: ["#ffffff", "#111111", "#1E334D"],
    tag: "Bestseller",
  },
  {
    id: "ot-02",
    name: "Boxy Fit Oversized Tee",
    category: "oversized-tees",
    price: 849,
    image:
      "https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=800&auto=format&fit=crop",
    hoverImage:
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800&auto=format&fit=crop",
    colors: ["#ffffff", "#6F7573", "#662735"],
  },
  {
    id: "ot-03",
    name: "Heavyweight Oversized Tee",
    category: "oversized-tees",
    price: 899,
    image:
      "https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=800&auto=format&fit=crop",
    colors: ["#111111", "#476748"],
    tag: "New",
  },
  {
    id: "ct-01",
    name: "Classic Crew-Neck Tee",
    category: "classic-tees",
    price: 599,
    image:
      "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=800&auto=format&fit=crop",
    colors: ["#ffffff", "#111111", "#1E334D", "#662735"],
    tag: "Bestseller",
  },
  {
    id: "ct-02",
    name: "Slim Fit V-Neck Tee",
    category: "classic-tees",
    price: 649,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop",
    colors: ["#ffffff", "#6F7573"],
  },
  {
    id: "ct-03",
    name: "Everyday Cotton Tee",
    category: "classic-tees",
    price: 549,
    image:
      "https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?q=80&w=800&auto=format&fit=crop",
    colors: ["#ffffff", "#111111", "#476748"],
  },
  {
    id: "po-01",
    name: "Pique Knit Polo",
    category: "polo",
    price: 899,
    image:
      "https://images.unsplash.com/photo-1610384104075-e05c8b220e2b?q=80&w=800&auto=format&fit=crop",
    colors: ["#ffffff", "#1E334D", "#476748"],
  },
  {
    id: "po-02",
    name: "Sport Performance Polo",
    category: "polo",
    price: 999,
    image:
      "https://images.unsplash.com/photo-1626497764746-6dc36546b388?q=80&w=800&auto=format&fit=crop",
    colors: ["#111111", "#6F7573"],
    tag: "New",
  },
  {
    id: "hd-01",
    name: "Fleece Pullover Hoodie",
    category: "hoodies",
    price: 1499,
    compareAt: 1799,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
    colors: ["#111111", "#6F7573", "#1E334D"],
    tag: "Bestseller",
  },
  {
    id: "hd-02",
    name: "Zip-Up Hoodie",
    category: "hoodies",
    price: 1599,
    image:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800&auto=format&fit=crop",
    colors: ["#111111", "#ffffff"],
  },
  {
    id: "sw-01",
    name: "Crew Sweatshirt",
    category: "sweatshirts",
    price: 1299,
    image:
      "https://images.unsplash.com/photo-1614251055880-ee96e4803393?q=80&w=800&auto=format&fit=crop",
    colors: ["#6F7573", "#111111", "#ffffff"],
  },
  {
    id: "sw-02",
    name: "Graphic Sweatshirt",
    category: "sweatshirts",
    price: 1349,
    image:
      "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?q=80&w=800&auto=format&fit=crop",
    colors: ["#111111", "#662735"],
    tag: "New",
  },
];

export function getProductsByCategory(slug?: string) {
  if (!slug || slug === "all") return PRODUCTS;
  return PRODUCTS.filter((p) => p.category === slug);
}

export function getProductById(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}
