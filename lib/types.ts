export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort: number;
  createdAt: string;
};

export type Design = {
  id: string;
  name: string;
  slug: string;
  /** Category slug */
  category: string;
  /** Print price in ₹, added on top of the garment's base price */
  price: number;
  image: string;
  description?: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
};

/**
 * Where artwork sits on a garment piece (front / back / sleeve). `x`/`y` are
 * the artwork's centre (0–1 across / down the piece), `w` its width as a
 * fraction of the piece's width (height follows the artwork's aspect ratio),
 * `rotation` in radians, clockwise.
 */
export type PrintPlacement = { x: number; y: number; w: number; rotation: number };

/** One design placed on a garment. A piece can hold several. */
export type PrintSpec = {
  location: string;
  placement: PrintPlacement;
  /** "gallery" = one of our designs, "upload" = customer artwork, "text" = text tool */
  designType: "gallery" | "upload" | "text";
  designId?: string;
  designName: string;
  /** URL of the artwork file to print */
  artworkUrl: string;
  /** Artwork width ÷ height */
  aspect: number;
  /** Design price, plus the area fee for the first print on each area (set by the server) */
  price?: number;
};

export type CartItem = {
  id: string;
  garment: string;
  garmentLabel: string;
  color: string;
  colorLabel: string;
  size: string;
  qty: number;
  unitPrice: number;
  prints: PrintSpec[];
  /** Snapshot of the 3D preview */
  previewUrl?: string;
};

/** Admin-editable catalogue settings. Missing keys fall back to the defaults in code. */
export type Settings = {
  garmentPrices: Record<string, number>;
  locationPrices: Record<string, number>;
  /** Garment slugs hidden from the store */
  hiddenGarments?: string[];
  /** Print-location ids hidden from the store */
  hiddenLocations?: string[];
  /** Per-garment overrides for name, fabric line and photo */
  garmentInfo?: Record<string, { label?: string; fabric?: string; image?: string }>;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "printing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type Order = {
  id: string;
  number: number;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  items: CartItem[];
  total: number;
  status: OrderStatus;
  note?: string;
};
