// Copies the local store (data/db.json + data/uploads) into Supabase.
//
//   1. Run supabase/schema.sql in the Supabase SQL editor.
//   2. Put NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
//   3. node scripts/migrate-to-supabase.mjs
//
// Safe to re-run: categories and designs are matched by slug, settings are
// overwritten, and orders are only copied while the Supabase orders table is
// still empty (so they're never duplicated).

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BUCKET = "print-designs";

// ── env ────────────────────────────────────────────────────────────────────
const env = {};
for (const file of [".env", ".env.local"]) {
  const p = path.join(root, file);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const dbFile = path.join(root, "data", "db.json");
if (!existsSync(dbFile)) {
  console.error("✗ No data/db.json found — nothing to migrate. (Run the site once locally to create it.)");
  process.exit(1);
}
const local = JSON.parse(readFileSync(dbFile, "utf8"));

const must = (res, what) => {
  if (res.error) {
    console.error(`✗ ${what}: ${res.error.message}`);
    if (/relation .* does not exist|schema cache/i.test(res.error.message)) {
      console.error("  → Run supabase/schema.sql in the Supabase SQL editor first.");
    }
    process.exit(1);
  }
  return res.data;
};

// ── 1. images ──────────────────────────────────────────────────────────────
const urlMap = new Map(); // "/api/uploads/x.jpg" → public Supabase URL
const uploadDir = path.join(root, "data", "uploads");
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };
if (existsSync(uploadDir)) {
  const files = readdirSync(uploadDir).filter((f) => MIME[path.extname(f).toLowerCase()]);
  for (const f of files) {
    const keyPath = `migrated/${f}`;
    must(
      await db.storage.from(BUCKET).upload(keyPath, readFileSync(path.join(uploadDir, f)), {
        contentType: MIME[path.extname(f).toLowerCase()],
        upsert: true,
      }),
      `upload ${f} (does the "${BUCKET}" bucket exist?)`
    );
    urlMap.set(`/api/uploads/${f}`, db.storage.from(BUCKET).getPublicUrl(keyPath).data.publicUrl);
  }
  console.log(`✓ ${files.length} images uploaded`);
}
const mapUrl = (u) => (u && urlMap.get(u)) || u;

// ── 2. categories ──────────────────────────────────────────────────────────
must(
  await db.from("categories").upsert(
    local.categories.map((c) => ({ name: c.name, slug: c.slug, description: c.description ?? null, sort: c.sort })),
    { onConflict: "slug" }
  ),
  "categories"
);
console.log(`✓ ${local.categories.length} categories`);

// ── 3. designs ─────────────────────────────────────────────────────────────
// Built-in designs keep their /designs/*.jpg paths (served from public/).
must(
  await db.from("print_designs").upsert(
    local.designs.map((d) => ({
      name: d.name,
      slug: d.slug,
      category: d.category,
      price: d.price,
      image_url: mapUrl(d.image),
      description: d.description ?? null,
      featured: !!d.featured,
      is_active: d.active !== false,
      created_at: d.createdAt,
    })),
    { onConflict: "slug" }
  ),
  "designs"
);
const remote = must(await db.from("print_designs").select("id, slug"), "read designs");
const idBySlug = new Map(remote.map((r) => [r.slug, r.id]));
const designId = new Map(local.designs.map((d) => [d.id, idBySlug.get(d.slug)]));
console.log(`✓ ${local.designs.length} designs`);

// ── 4. settings (prices, hidden garments/areas, garment info) ─────────────
if (local.settings) {
  const s = structuredClone(local.settings);
  for (const info of Object.values(s.garmentInfo ?? {})) if (info?.image) info.image = mapUrl(info.image);
  must(await db.from("settings").upsert({ key: "pricing", value: s }), "settings");
  console.log("✓ prices & garment / print-area settings");
}

// ── 5. orders ──────────────────────────────────────────────────────────────
const { count } = await db.from("orders").select("id", { count: "exact", head: true });
if ((count ?? 0) > 0) {
  console.log(`• orders skipped — Supabase already has ${count} order(s)`);
} else if (local.orders?.length) {
  const rows = [...local.orders]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((o) => ({
      customer: o.customer,
      items: o.items.map((it) => ({
        ...it,
        previewUrl: mapUrl(it.previewUrl),
        prints: (it.prints ?? []).map((p) => ({
          ...p,
          artworkUrl: mapUrl(p.artworkUrl),
          designId: p.designId ? designId.get(p.designId) ?? p.designId : undefined,
        })),
      })),
      total: o.total,
      status: o.status,
      note: o.note ?? null,
      created_at: o.createdAt,
    }));
  must(await db.from("orders").insert(rows), "orders");
  console.log(`✓ ${rows.length} orders (they get new order numbers starting at #1001)`);
}

console.log("\nDone. Restart the site — it now uses Supabase.");
