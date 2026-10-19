import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/server/auth";
import { store } from "@/lib/server/store";
import { GARMENTS } from "@/lib/garments";
import { PRINT_LOCATIONS } from "@/lib/print-locations";
import type { Settings } from "@/lib/types";

const GARMENT_IDS = GARMENTS.map((g) => g.slug);
const LOCATION_IDS = PRINT_LOCATIONS.map((l) => l.id);

// Saves the catalogue settings: garment/print-area prices, which ones are
// hidden, and garment names / fabric lines / photos / colours.
export async function PUT(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const prices = (input: unknown, keys: string[]) => {
    const out: Record<string, number> = {};
    const obj = (input ?? {}) as Record<string, unknown>;
    for (const k of keys) {
      const n = Math.round(Number(obj[k]));
      if (Number.isFinite(n) && n >= 0) out[k] = n;
    }
    return out;
  };
  const ids = (input: unknown, keys: string[]) =>
    Array.isArray(input) ? [...new Set(input.filter((x): x is string => typeof x === "string" && keys.includes(x)))] : [];

  const hiddenGarments = ids(body.hiddenGarments, GARMENT_IDS);
  const hiddenLocations = ids(body.hiddenLocations, LOCATION_IDS);
  if (hiddenGarments.length >= GARMENT_IDS.length) {
    return Response.json({ error: "Keep at least one garment visible." }, { status: 400 });
  }
  if (hiddenLocations.length >= LOCATION_IDS.length) {
    return Response.json({ error: "Keep at least one print area visible." }, { status: 400 });
  }

  const garmentInfo: NonNullable<Settings["garmentInfo"]> = {};
  const info = (body.garmentInfo ?? {}) as Record<string, Record<string, unknown>>;
  for (const slug of GARMENT_IDS) {
    const o = info[slug];
    if (!o) continue;
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const image = str(o.image, 1000);
    garmentInfo[slug] = {
      label: str(o.label, 60) || undefined,
      fabric: str(o.fabric, 160) || undefined,
      // Only our own uploads or https images
      image: image && (image.startsWith("/") || image.startsWith("https://")) ? image : undefined,
    };
  }

  // Each garment's colours: valid "#rrggbb" + name, no repeats, at least one.
  const garmentColors: NonNullable<Settings["garmentColors"]> = {};
  const colorsIn = (body.garmentColors ?? {}) as Record<string, unknown>;
  for (const slug of GARMENT_IDS) {
    const list = colorsIn[slug];
    if (!Array.isArray(list)) continue;
    const seen = new Set<string>();
    const clean = list
      .map((c) => c as { hex?: unknown; label?: unknown })
      .filter((c) => typeof c.hex === "string" && /^#[0-9a-f]{6}$/i.test(c.hex) && typeof c.label === "string" && c.label.trim())
      .map((c) => ({ hex: (c.hex as string).toLowerCase(), label: (c.label as string).trim().slice(0, 30) }))
      .filter((c) => !seen.has(c.hex) && seen.add(c.hex))
      .slice(0, 24);
    if (!clean.length) {
      return Response.json({ error: "Every garment needs at least one colour." }, { status: 400 });
    }
    garmentColors[slug] = clean;
  }

  const settings = await store.updateSettings({
    garmentPrices: prices(body.garmentPrices, GARMENT_IDS),
    locationPrices: prices(body.locationPrices, LOCATION_IDS),
    hiddenGarments,
    hiddenLocations,
    garmentInfo,
    garmentColors,
  });
  revalidatePath("/", "layout");
  return Response.json(settings);
}
