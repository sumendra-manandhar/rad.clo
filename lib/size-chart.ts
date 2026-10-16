// Garment measurements in cm, measured flat. Replace these with your
// supplier's exact numbers — customers rely on them to pick a size.

export type SizeRow = { size: string; chest: number; length: number; sleeve: number };

/** chest = armpit to armpit (×2 for full chest), length = shoulder to hem */
export const SIZE_CHART: Record<string, SizeRow[]> = {
  "oversized-tee": [
    { size: "S", chest: 54, length: 70, sleeve: 22 },
    { size: "M", chest: 57, length: 72, sleeve: 23 },
    { size: "L", chest: 60, length: 74, sleeve: 24 },
    { size: "XL", chest: 63, length: 76, sleeve: 25 },
    { size: "2XL", chest: 66, length: 78, sleeve: 26 },
  ],
  "classic-tee": [
    { size: "S", chest: 46, length: 69, sleeve: 19 },
    { size: "M", chest: 50, length: 72, sleeve: 20 },
    { size: "L", chest: 53, length: 74, sleeve: 21 },
    { size: "XL", chest: 56, length: 76, sleeve: 22 },
    { size: "2XL", chest: 59, length: 78, sleeve: 23 },
  ],
  polo: [
    { size: "S", chest: 48, length: 68, sleeve: 20 },
    { size: "M", chest: 51, length: 71, sleeve: 21 },
    { size: "L", chest: 54, length: 73, sleeve: 22 },
    { size: "XL", chest: 57, length: 75, sleeve: 23 },
    { size: "2XL", chest: 60, length: 77, sleeve: 24 },
  ],
  hoodie: [
    { size: "S", chest: 52, length: 66, sleeve: 60 },
    { size: "M", chest: 55, length: 69, sleeve: 62 },
    { size: "L", chest: 58, length: 72, sleeve: 64 },
    { size: "XL", chest: 61, length: 74, sleeve: 66 },
    { size: "2XL", chest: 64, length: 76, sleeve: 67 },
  ],
  sweatshirt: [
    { size: "S", chest: 51, length: 65, sleeve: 60 },
    { size: "M", chest: 54, length: 68, sleeve: 62 },
    { size: "L", chest: 57, length: 70, sleeve: 64 },
    { size: "XL", chest: 60, length: 72, sleeve: 66 },
    { size: "2XL", chest: 63, length: 74, sleeve: 67 },
  ],
};

/**
 * Model photos shown with the size chart. Put the images in public/models/
 * and list them here; the photo row is hidden while this list is empty.
 * Example: { src: "/models/oversized-m.jpg", garment: "oversized-tee",
 *            caption: "Aayush is 178 cm, 70 kg and wears M" }
 */
export const MODEL_PHOTOS: { src: string; garment: string; caption: string }[] = [];
