import { supabase } from "@/lib/supabase";

export type Design = {
  id: string;
  name: string;
  category: string;
  src: string;
};

// Local, built-in gallery — always available even if Supabase isn't
// configured yet, or if a fetch from it fails.
export const DESIGN_CATEGORIES = [
  "Typography",
  "Streetwear",
  "Minimal",
  "Nature",
  "Doodle",
] as const;

export const DESIGNS: Design[] = [
  { id: "d1", name: "Stay Hungry", category: "Typography", src: "/designs/typo-hustle.jpg" },
  { id: "d2", name: "Good Vibes Only", category: "Typography", src: "/designs/typo-vibes.jpg" },
  { id: "d3", name: "Forward Arrow", category: "Typography", src: "/designs/arrow-mono.jpg" },
  { id: "d4", name: "Street Skull", category: "Streetwear", src: "/designs/skull-street.jpg" },
  { id: "d5", name: "Lightning Bolt", category: "Streetwear", src: "/designs/lightning-bolt.jpg" },
  { id: "d6", name: "Tiger Face", category: "Streetwear", src: "/designs/tiger-face.jpg" },
  { id: "d7", name: "Mountain Line", category: "Minimal", src: "/designs/mountain-line.jpg" },
  { id: "d8", name: "Abstract Wave", category: "Minimal", src: "/designs/wave-abstract.jpg" },
  { id: "d9", name: "Peace Sign", category: "Minimal", src: "/designs/peace-sign.jpg" },
  { id: "d10", name: "Sun Rays", category: "Nature", src: "/designs/sun-rays.jpg" },
  { id: "d11", name: "Line Flower", category: "Nature", src: "/designs/flower-line.jpg" },
  { id: "d12", name: "Cat Doodle", category: "Doodle", src: "/designs/cat-doodle.jpg" },
];

export function getDesignsByCategory(category: string | undefined, pool: Design[] = DESIGNS) {
  if (!category || category === "All") return pool;
  return pool.filter((d) => d.category === category);
}

// Shape of a row in the `print_designs` table — see SETUP.md for the exact
// schema to create in your Supabase project.
type PrintDesignRow = {
  id: string;
  name: string;
  category: string | null;
  image_url: string;
  is_active: boolean | null;
};

/**
 * Fetches designs uploaded via Supabase (Storage + the `print_designs`
 * table). Returns an empty array (never throws) if Supabase isn't
 * configured yet or the request fails — callers should merge this with
 * the local DESIGNS array so the gallery still works either way.
 */
export async function fetchSupabaseDesigns(): Promise<Design[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("print_designs")
    .select("id, name, category, image_url, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[designs] failed to load Supabase print designs:", error.message);
    return [];
  }

  return (data as PrintDesignRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category || "Uploaded",
    src: row.image_url,
  }));
}

// ── Admin-only functions below (used by /admin/designs) ─────────────────────

export type AdminDesignRow = {
  id: string;
  name: string;
  category: string | null;
  image_url: string;
  is_active: boolean;
  created_at: string;
};

/** Fetches every design row (active AND inactive) — admin view only. */
export async function fetchAllSupabaseDesigns(): Promise<AdminDesignRow[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("print_designs")
    .select("id, name, category, image_url, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[designs] failed to load designs for admin:", error.message);
    return [];
  }
  return (data as AdminDesignRow[]) || [];
}

/** Uploads a design image file to the `print-designs` bucket and inserts a row. */
export async function createSupabaseDesign(
  file: File,
  name: string,
  category: string
): Promise<boolean> {
  if (!supabase) return false;

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("print-designs")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadErr) {
    console.error("[designs] failed to upload design image:", uploadErr.message);
    return false;
  }

  const { data: pub } = supabase.storage.from("print-designs").getPublicUrl(path);

  const { error: insertErr } = await supabase.from("print_designs").insert({
    name,
    category: category || null,
    image_url: pub.publicUrl,
    is_active: true,
  });
  if (insertErr) {
    console.error("[designs] failed to save design row:", insertErr.message);
    return false;
  }
  return true;
}

export async function toggleSupabaseDesignActive(
  id: string,
  isActive: boolean
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("print_designs")
    .update({ is_active: isActive })
    .eq("id", id);
  return !error;
}

export async function deleteSupabaseDesign(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("print_designs").delete().eq("id", id);
  return !error;
}
