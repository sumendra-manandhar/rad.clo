// Customer sign-in (Supabase Auth with Google). It needs the project URL and
// the public "anon" / "publishable" key. Without them the site still works,
// and orders are placed without an account.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const authEnabled = !!(supabaseUrl && supabasePublicKey);
