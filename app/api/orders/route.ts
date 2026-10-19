import { randomInt } from "crypto";
import { getPricing, store } from "@/lib/server/store";
import { currentUser } from "@/lib/server/user";
import { authEnabled } from "@/lib/supabase/config";
import { newTrackCode } from "@/lib/track";
import { SIZES, colorLabel, shippingFor, visibleGarments, visibleLocations } from "@/lib/garments";
import { PLACEMENT_VERSION, cleanPlacement, getLocation, upgradeV2Placement } from "@/lib/print-locations";
import type { CartItem, PrintSpec } from "@/lib/types";

// Places an order. Prices are recalculated here from the catalogue and the
// admin's pricing — the prices the browser sends are never trusted.
export async function POST(req: Request) {
  let body: { customer?: Record<string, unknown>; items?: CartItem[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  // Orders need a signed-in customer once Google sign-in is set up.
  const user = await currentUser();
  if (authEnabled && !user) {
    return Response.json({ error: "Please sign in to place your order.", signIn: true }, { status: 401 });
  }

  const c = body.customer ?? {};
  const str = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const customer = {
    name: str(c.name, 120),
    phone: str(c.phone, 30),
    email: str(c.email, 160) || user?.email || undefined,
    address: str(c.address, 600),
  };
  if (!customer.name || !customer.phone || !customer.address) {
    return Response.json({ error: "Name, phone and address are required." }, { status: 400 });
  }

  const raw = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
  if (raw.length === 0) return Response.json({ error: "Your cart is empty." }, { status: 400 });

  const [designs, pricing] = await Promise.all([store.listDesigns(), getPricing()]);
  const fail = (error: string) => Response.json({ error }, { status: 400 });

  const items: CartItem[] = [];
  for (const it of raw) {
    const garment = visibleGarments(pricing).find((g) => g.slug === it.garment);
    if (!garment || !SIZES.includes(it.size)) return fail("An item in your cart is no longer available.");

    // Each piece used is charged once; every store design adds its own price.
    const prints: PrintSpec[] = [];
    const charged = new Set<string>();
    for (const p of Array.isArray(it.prints) ? it.prints.slice(0, 12) : []) {
      const loc = visibleLocations(pricing).find((l) => l.id === p.location) ?? null;
      if (!loc) return fail(`Printing on the ${getLocation(p.location)?.label ?? "selected area"} is no longer available.`);
      if (p.v !== 2 && p.v !== PLACEMENT_VERSION) {
        return fail("We've updated our print areas. Please remove the older item from your cart and add it again.");
      }
      let designPrice = 0;
      let designName = str(p.designName, 200) || "Custom print";
      let artworkUrl = str(p.artworkUrl, 1000);
      if (p.designType === "gallery") {
        const d = designs.find((x) => x.id === p.designId && x.active);
        if (!d) return fail("A design in your cart is no longer available.");
        designPrice = d.price;
        designName = d.name;
        artworkUrl = d.image;
      } else if (p.designType !== "upload" && p.designType !== "text") {
        return fail("Invalid print.");
      }
      if (!artworkUrl) return fail("A print in your cart is missing its artwork.");
      const areaFee = charged.has(loc.id) ? 0 : pricing.location[loc.id];
      charged.add(loc.id);
      const aspect = Number(p.aspect);
      prints.push({
        location: loc.id,
        // Carts saved before full front/back grew to 13″ × 20″ keep their real print size
        placement: p.v === 2 ? upgradeV2Placement(loc, cleanPlacement(p.placement)) : cleanPlacement(p.placement),
        aspect: Number.isFinite(aspect) && aspect > 0.05 && aspect < 20 ? aspect : 1,
        designType: p.designType,
        designId: p.designType === "gallery" ? p.designId : undefined,
        designName,
        artworkUrl,
        price: areaFee + designPrice,
        v: PLACEMENT_VERSION,
      });
    }

    const color = /^#[0-9a-f]{6}$/i.test(it.color) ? it.color : "#ffffff";
    items.push({
      id: str(it.id, 60),
      garment: garment.slug,
      garmentLabel: garment.label,
      color,
      colorLabel: colorLabel(color),
      size: it.size,
      qty: Math.min(Math.max(1, Math.floor(Number(it.qty) || 1)), 500),
      unitPrice: pricing.garment[garment.slug] + prints.reduce((s, p) => s + (p.price ?? 0), 0),
      prints,
      previewUrl: str(it.previewUrl, 1000) || undefined,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const total = subtotal + shippingFor(subtotal);
  const order = await store.createOrder({
    customer,
    items,
    total,
    note: str(c.note, 1000) || undefined,
    trackCode: newTrackCode(randomInt),
    userId: user?.id,
  });

  // Remember phone and address for next time.
  if (user) {
    await store
      .saveProfile({ id: user.id, email: user.email, name: customer.name || user.name, avatarUrl: user.avatarUrl, phone: customer.phone, address: customer.address })
      .catch((err) => console.error("[orders] couldn't save profile:", err));
  }
  return Response.json({ id: order.id, number: order.number, total: order.total, trackCode: order.trackCode });
}
