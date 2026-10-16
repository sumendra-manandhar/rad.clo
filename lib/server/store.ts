import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag, unstable_cache } from "next/cache";
import {
  ORDER_STATUSES,
  QUOTE_STATUSES,
  type Category,
  type Design,
  type Order,
  type OrderStatus,
  type Quote,
  type QuoteStatus,
  type Settings,
} from "@/lib/types";
import { resolvePricing } from "@/lib/garments";
import { SEED_CATEGORIES, SEED_DESIGNS } from "@/lib/server/seed";

// ─────────────────────────────────────────────────────────────────────────────
// Storage for categories, designs, orders and uploaded images.
//
// Two drivers share one interface:
//   • Local (default)  — data/db.json + data/uploads/. Zero setup; works with
//                        `npm run dev` / `npm start` on any normal server.
//   • Supabase         — used automatically when NEXT_PUBLIC_SUPABASE_URL and
//                        SUPABASE_SERVICE_ROLE_KEY are set. Needed for
//                        serverless hosts (Vercel) with a read-only disk.
//                        Schema: supabase/schema.sql
// ─────────────────────────────────────────────────────────────────────────────

export type NewDesign = Omit<Design, "id" | "createdAt" | "slug"> & { slug?: string };
export type NewCategory = Omit<Category, "id" | "createdAt">;
export type NewOrder = Omit<Order, "id" | "createdAt" | "number" | "status">;
export type NewQuote = Omit<Quote, "id" | "createdAt" | "status" | "note">;
export type QuotePatch = { status?: QuoteStatus; note?: string };

interface Store {
  listCategories(): Promise<Category[]>;
  createCategory(input: NewCategory): Promise<Category>;
  updateCategory(id: string, patch: Partial<NewCategory>): Promise<Category | null>;
  deleteCategory(id: string): Promise<boolean>;

  listDesigns(): Promise<Design[]>;
  getDesign(id: string): Promise<Design | null>;
  createDesign(input: NewDesign): Promise<Design>;
  updateDesign(id: string, patch: Partial<NewDesign>): Promise<Design | null>;
  deleteDesign(id: string): Promise<boolean>;

  listOrders(): Promise<Order[]>;
  createOrder(input: NewOrder): Promise<Order>;
  updateOrder(id: string, patch: { status?: OrderStatus; note?: string }): Promise<Order | null>;

  listQuotes(): Promise<Quote[]>;
  createQuote(input: NewQuote): Promise<Quote>;
  updateQuote(id: string, patch: QuotePatch): Promise<Quote | null>;

  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  /** Saves an image and returns its public URL */
  saveUpload(data: Buffer, ext: string, folder: string): Promise<string>;
  /** Removes an image previously returned by saveUpload (no-op for others) */
  deleteUpload(url: string): Promise<void>;
}

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

const byCreatedDesc = <T extends { createdAt: string }>(a: T, b: T) =>
  b.createdAt.localeCompare(a.createdAt);

// ── Local JSON driver ───────────────────────────────────────────────────────
type DB = { categories: Category[]; designs: Design[]; orders: Order[]; quotes?: Quote[]; settings?: Settings };

const EMPTY_SETTINGS: Settings = {
  garmentPrices: {},
  locationPrices: {},
  hiddenGarments: [],
  hiddenLocations: [],
  garmentInfo: {},
};

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

class LocalStore implements Store {
  // Serialises writes so concurrent requests can't clobber each other.
  private queue: Promise<unknown> = Promise.resolve();

  private async read(): Promise<DB> {
    try {
      return JSON.parse(await fs.readFile(DB_FILE, "utf8")) as DB;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      const seeded: DB = { categories: SEED_CATEGORIES, designs: SEED_DESIGNS, orders: [] };
      try {
        await this.write(seeded);
      } catch (writeErr) {
        // Read-only disk (e.g. Vercel without Supabase configured): keep the
        // storefront up with the built-in catalogue instead of crashing.
        if (!isReadOnly(writeErr)) throw writeErr;
        if (!warnedReadOnly) {
          warnedReadOnly = true;
          console.warn(`[store] ${READ_ONLY_MESSAGE} Serving the built-in catalogue read-only.`);
        }
      }
      return seeded;
    }
  }

  private async write(db: DB) {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tmp = `${DB_FILE}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2));
      await fs.rename(tmp, DB_FILE);
    } catch (err) {
      if (isReadOnly(err)) throw new Error(READ_ONLY_MESSAGE);
      throw err;
    }
  }

  private mutate<T>(fn: (db: DB) => T): Promise<T> {
    const run = this.queue.then(async () => {
      const db = await this.read();
      const result = fn(db);
      await this.write(db);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  async listCategories() {
    return (await this.read()).categories.sort((a, b) => a.sort - b.sort);
  }
  createCategory(input: NewCategory) {
    return this.mutate((db) => {
      const c: Category = { ...input, id: randomUUID(), createdAt: new Date().toISOString() };
      db.categories.push(c);
      return c;
    });
  }
  updateCategory(id: string, patch: Partial<NewCategory>) {
    return this.mutate((db) => {
      const c = db.categories.find((x) => x.id === id);
      if (!c) return null;
      const oldSlug = c.slug;
      Object.assign(c, patch);
      if (patch.slug && patch.slug !== oldSlug) {
        db.designs.forEach((d) => d.category === oldSlug && (d.category = patch.slug!));
      }
      return c;
    });
  }
  deleteCategory(id: string) {
    return this.mutate((db) => {
      const before = db.categories.length;
      db.categories = db.categories.filter((c) => c.id !== id);
      return db.categories.length < before;
    });
  }

  async listDesigns() {
    return (await this.read()).designs.sort(byCreatedDesc);
  }
  async getDesign(id: string) {
    return (await this.read()).designs.find((d) => d.id === id || d.slug === id) ?? null;
  }
  createDesign(input: NewDesign) {
    return this.mutate((db) => {
      const d: Design = {
        ...input,
        slug: uniqueSlug(input.slug || input.name, db.designs),
        id: randomUUID(),
        createdAt: new Date().toISOString(),
      };
      db.designs.push(d);
      return d;
    });
  }
  updateDesign(id: string, patch: Partial<NewDesign>) {
    return this.mutate((db) => {
      const d = db.designs.find((x) => x.id === id);
      if (!d) return null;
      Object.assign(d, patch);
      if (patch.slug) d.slug = uniqueSlug(patch.slug, db.designs.filter((x) => x.id !== id));
      return d;
    });
  }
  deleteDesign(id: string) {
    return this.mutate((db) => {
      const before = db.designs.length;
      db.designs = db.designs.filter((d) => d.id !== id);
      return db.designs.length < before;
    });
  }

  async listOrders() {
    return (await this.read()).orders.sort(byCreatedDesc);
  }
  createOrder(input: NewOrder) {
    return this.mutate((db) => {
      const o: Order = {
        ...input,
        id: randomUUID(),
        number: 1000 + db.orders.length + 1,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      db.orders.push(o);
      return o;
    });
  }
  updateOrder(id: string, patch: { status?: OrderStatus; note?: string }) {
    return this.mutate((db) => {
      const o = db.orders.find((x) => x.id === id);
      if (!o) return null;
      Object.assign(o, patch);
      return o;
    });
  }

  async listQuotes() {
    return ((await this.read()).quotes ?? []).sort(byCreatedDesc);
  }
  createQuote(input: NewQuote) {
    return this.mutate((db) => {
      const q: Quote = { ...input, id: randomUUID(), status: "new", createdAt: new Date().toISOString() };
      (db.quotes ??= []).push(q);
      return q;
    });
  }
  updateQuote(id: string, patch: QuotePatch) {
    return this.mutate((db) => {
      const q = db.quotes?.find((x) => x.id === id);
      if (!q) return null;
      Object.assign(q, patch);
      return q;
    });
  }

  async getSettings() {
    return { ...EMPTY_SETTINGS, ...(await this.read()).settings };
  }
  updateSettings(patch: Partial<Settings>) {
    return this.mutate((db) => {
      db.settings = { ...EMPTY_SETTINGS, ...db.settings, ...patch };
      return db.settings;
    });
  }

  async saveUpload(data: Buffer, ext: string, folder: string) {
    const name = `${folder}-${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      await fs.writeFile(path.join(UPLOAD_DIR, name), data);
    } catch (err) {
      if (isReadOnly(err)) throw new Error(READ_ONLY_MESSAGE);
      throw err;
    }
    // Files in public/ are only served if present at build time, so uploads
    // are streamed back through app/api/uploads/[file]/route.ts instead.
    return `/api/uploads/${name}`;
  }
  async deleteUpload(url: string) {
    if (!url.startsWith("/api/uploads/")) return;
    const name = path.basename(url);
    await fs.rm(path.join(UPLOAD_DIR, name), { force: true });
  }
}

const READ_ONLY_MESSAGE =
  "This server's disk is read-only, so nothing can be saved. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to store data in Supabase.";
let warnedReadOnly = false;

function isReadOnly(err: unknown) {
  const code = (err as NodeJS.ErrnoException)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

function uniqueSlug(base: string, existing: { slug: string }[]) {
  const root = slugify(base);
  let slug = root;
  for (let i = 2; existing.some((d) => d.slug === slug); i++) slug = `${root}-${i}`;
  return slug;
}

// ── Supabase driver ─────────────────────────────────────────────────────────
const BUCKET = "print-designs";

type DesignRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  image_url: string;
  description: string | null;
  featured: boolean;
  is_active: boolean;
  created_at: string;
};
type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort: number;
  created_at: string;
};
type OrderRow = {
  id: string;
  number: number | null;
  customer: Order["customer"] | null;
  items: Order["items"] | null;
  total: number | null;
  status: string;
  note: string | null;
  created_at: string;
  // Columns from the August version of the site (see supabase/upgrade-orders.sql)
  customer_name?: string | null;
  phone?: string | null;
  address?: string | null;
  email?: string | null;
  total_price?: number | string | null;
};

const toDesign = (r: DesignRow): Design => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  category: r.category,
  price: r.price,
  image: r.image_url,
  description: r.description ?? undefined,
  featured: r.featured,
  active: r.is_active,
  createdAt: r.created_at,
});
const fromDesign = (d: Partial<NewDesign>) => {
  const row: Record<string, unknown> = {};
  if (d.name !== undefined) row.name = d.name;
  if (d.slug !== undefined) row.slug = slugify(d.slug);
  if (d.category !== undefined) row.category = d.category;
  if (d.price !== undefined) row.price = d.price;
  if (d.image !== undefined) row.image_url = d.image;
  if (d.description !== undefined) row.description = d.description;
  if (d.featured !== undefined) row.featured = d.featured;
  if (d.active !== undefined) row.is_active = d.active;
  return row;
};
const toCategory = (r: CategoryRow): Category => ({
  id: r.id,
  name: r.name,
  slug: r.slug,
  description: r.description ?? undefined,
  sort: r.sort,
  createdAt: r.created_at,
});
// Tolerates rows from the old orders table that haven't been upgraded yet,
// so the admin never crashes on them.
const toOrder = (r: OrderRow): Order => ({
  id: r.id,
  number: r.number ?? 0,
  customer: r.customer ?? {
    name: r.customer_name ?? "",
    phone: r.phone ?? "",
    email: r.email ?? undefined,
    address: r.address ?? "",
  },
  items: Array.isArray(r.items)
    ? r.items.map((i) => ({ ...i, prints: Array.isArray(i.prints) ? i.prints : [] }))
    : [],
  total: r.total ?? Math.round(Number(r.total_price) || 0),
  status: (ORDER_STATUSES as readonly string[]).includes(r.status) ? (r.status as OrderStatus) : "pending",
  note: r.note ?? undefined,
  createdAt: r.created_at,
});

type QuoteRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  organisation: string | null;
  purpose: string;
  garment: string;
  quantity: number;
  needed_by: string;
  budget: string;
  message: string | null;
  status: string;
  note: string | null;
  created_at: string;
};
const toQuote = (r: QuoteRow): Quote => ({
  id: r.id,
  name: r.name,
  phone: r.phone,
  email: r.email ?? undefined,
  organisation: r.organisation ?? undefined,
  purpose: r.purpose,
  garment: r.garment,
  quantity: r.quantity,
  neededBy: r.needed_by,
  budget: r.budget,
  message: r.message ?? undefined,
  status: (QUOTE_STATUSES as readonly string[]).includes(r.status) ? (r.status as QuoteStatus) : "new",
  note: r.note ?? undefined,
  createdAt: r.created_at,
});

// Throws on a Supabase error; callers cast the untyped result to their row type.
function check(res: { data: unknown; error: { message: string } | null }): unknown {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

class SupabaseStore implements Store {
  constructor(private db: SupabaseClient) {}

  async listCategories() {
    const rows = check(await this.db.from("categories").select("*").order("sort"));
    return (rows as CategoryRow[]).map(toCategory);
  }
  async createCategory(input: NewCategory) {
    const row = check(
      await this.db
        .from("categories")
        .insert({ ...input, slug: slugify(input.slug || input.name) })
        .select()
        .single()
    );
    return toCategory(row as CategoryRow);
  }
  async updateCategory(id: string, patch: Partial<NewCategory>) {
    const old = check(await this.db.from("categories").select("slug").eq("id", id).maybeSingle()) as
      | { slug: string }
      | null;
    if (!old) return null;
    const row = check(await this.db.from("categories").update(patch).eq("id", id).select().single());
    if (patch.slug && patch.slug !== old.slug) {
      check(await this.db.from("print_designs").update({ category: patch.slug }).eq("category", old.slug));
    }
    return toCategory(row as CategoryRow);
  }
  async deleteCategory(id: string) {
    check(await this.db.from("categories").delete().eq("id", id));
    return true;
  }

  async listDesigns() {
    const rows = check(
      await this.db.from("print_designs").select("*").order("created_at", { ascending: false })
    );
    return (rows as DesignRow[]).map(toDesign);
  }
  async getDesign(id: string) {
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    const row = check(
      await this.db
        .from("print_designs")
        .select("*")
        .eq(isUuid ? "id" : "slug", id)
        .maybeSingle()
    );
    return row ? toDesign(row as DesignRow) : null;
  }
  async createDesign(input: NewDesign) {
    const existing = check(await this.db.from("print_designs").select("slug")) as { slug: string }[];
    const row = check(
      await this.db
        .from("print_designs")
        .insert({ ...fromDesign(input), slug: uniqueSlug(input.slug || input.name, existing) })
        .select()
        .single()
    );
    return toDesign(row as DesignRow);
  }
  async updateDesign(id: string, patch: Partial<NewDesign>) {
    const row = check(
      await this.db.from("print_designs").update(fromDesign(patch)).eq("id", id).select().maybeSingle()
    );
    return row ? toDesign(row as DesignRow) : null;
  }
  async deleteDesign(id: string) {
    check(await this.db.from("print_designs").delete().eq("id", id));
    return true;
  }

  async listOrders() {
    const rows = check(await this.db.from("orders").select("*").order("created_at", { ascending: false }));
    return (rows as OrderRow[]).map(toOrder);
  }
  async createOrder(input: NewOrder) {
    // `number` comes from an identity column in the database.
    const row = check(await this.db.from("orders").insert(input).select().single());
    return toOrder(row as OrderRow);
  }
  async updateOrder(id: string, patch: { status?: OrderStatus; note?: string }) {
    const row = check(await this.db.from("orders").update(patch).eq("id", id).select().maybeSingle());
    return row ? toOrder(row as OrderRow) : null;
  }

  async listQuotes() {
    const rows = check(await this.db.from("quotes").select("*").order("created_at", { ascending: false }));
    return (rows as QuoteRow[]).map(toQuote);
  }
  async createQuote(q: NewQuote) {
    const row = check(
      await this.db
        .from("quotes")
        .insert({
          name: q.name,
          phone: q.phone,
          email: q.email ?? null,
          organisation: q.organisation ?? null,
          purpose: q.purpose,
          garment: q.garment,
          quantity: q.quantity,
          needed_by: q.neededBy,
          budget: q.budget,
          message: q.message ?? null,
        })
        .select()
        .single()
    );
    return toQuote(row as QuoteRow);
  }
  async updateQuote(id: string, patch: QuotePatch) {
    const row = check(await this.db.from("quotes").update(patch).eq("id", id).select().maybeSingle());
    return row ? toQuote(row as QuoteRow) : null;
  }

  async getSettings() {
    const row = check(await this.db.from("settings").select("value").eq("key", "pricing").maybeSingle()) as
      | { value: Settings }
      | null;
    return { ...EMPTY_SETTINGS, ...row?.value };
  }
  async updateSettings(patch: Partial<Settings>) {
    const value = { ...(await this.getSettings()), ...patch };
    check(await this.db.from("settings").upsert({ key: "pricing", value }));
    return value;
  }

  async saveUpload(data: Buffer, ext: string, folder: string) {
    const key = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext === "svg" ? "svg+xml" : ext}`;
    check(await this.db.storage.from(BUCKET).upload(key, data, { contentType }));
    return this.db.storage.from(BUCKET).getPublicUrl(key).data.publicUrl;
  }
  async deleteUpload(url: string) {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const i = url.indexOf(marker);
    if (i === -1) return;
    await this.db.storage.from(BUCKET).remove([url.slice(i + marker.length)]);
  }
}

// ── Driver selection ────────────────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const storeDriver = supabaseUrl && serviceKey ? "supabase" : "local";

const backend: Store =
  storeDriver === "supabase"
    ? new SupabaseStore(createClient(supabaseUrl!, serviceKey!, { auth: { persistSession: false } }))
    : new LocalStore();

// ── Catalogue cache ─────────────────────────────────────────────────────────
// Categories, designs and prices are read on almost every page but only
// change when the admin saves something, so they're cached instead of
// hitting the database on every click. Every write through `store` clears
// the cache straight away. Edits made directly in the Supabase dashboard
// show up within 5 minutes. Orders and quotes are never cached.
const CATALOG_TAG = "catalog";

function withCatalogCache(s: Store): Store {
  const cached = <T>(key: string, fn: () => Promise<T>) =>
    unstable_cache(fn, ["store", storeDriver, key], { tags: [CATALOG_TAG], revalidate: 300 });
  const changes =
    <A extends unknown[], R>(fn: (...args: A) => Promise<R>) =>
    async (...args: A) => {
      const result = await fn(...args);
      revalidateTag(CATALOG_TAG, { expire: 0 });
      return result;
    };

  return {
    listCategories: cached("categories", () => s.listCategories()),
    createCategory: changes((input) => s.createCategory(input)),
    updateCategory: changes((id, patch) => s.updateCategory(id, patch)),
    deleteCategory: changes((id) => s.deleteCategory(id)),

    listDesigns: cached("designs", () => s.listDesigns()),
    getDesign: (id) => s.getDesign(id),
    createDesign: changes((input) => s.createDesign(input)),
    updateDesign: changes((id, patch) => s.updateDesign(id, patch)),
    deleteDesign: changes((id) => s.deleteDesign(id)),

    listOrders: () => s.listOrders(),
    createOrder: (input) => s.createOrder(input),
    updateOrder: (id, patch) => s.updateOrder(id, patch),

    listQuotes: () => s.listQuotes(),
    createQuote: (input) => s.createQuote(input),
    updateQuote: (id, patch) => s.updateQuote(id, patch),

    getSettings: cached("settings", () => s.getSettings()),
    updateSettings: changes((patch) => s.updateSettings(patch)),

    saveUpload: (data, ext, folder) => s.saveUpload(data, ext, folder),
    deleteUpload: (url) => s.deleteUpload(url),
  };
}

export const store: Store = withCatalogCache(backend);

/** Current prices (admin settings merged over the defaults in code) */
export async function getPricing() {
  return resolvePricing(await store.getSettings());
}

/** Designs, categories and prices visible on the storefront */
export async function getStorefront() {
  const [categories, designs, pricing] = await Promise.all([
    store.listCategories(),
    store.listDesigns(),
    getPricing(),
  ]);
  return { categories, designs: designs.filter((d) => d.active), pricing };
}
