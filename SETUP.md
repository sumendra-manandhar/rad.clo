# Rad.Clo — Custom T-Shirt Website

## What's included
- **Home** (`/`) — hero with live 3D t-shirt viewer, shop-by-category section, new arrivals, FAQ
- **Shop** (`/shop`) — category-filterable product grid (Oversized Tees, Classic Tees, Polo, Hoodies, Sweatshirts)
- **Customize** (`/customize`) — full designer:
  - pick garment category, color, size
  - upload your own artwork (PNG/JPG/SVG) **or** pick from a built-in print gallery (Typography, Streetwear, Minimal, Nature, Doodle)
  - live 3D preview with your design projected onto the shirt (front/back, scale, rotation, position sliders)
  - add to cart
- **Contact** (`/contact`) — contact form + info
- **Cart** (`/cart`) — cart with quantities + a mock checkout (collects name/phone/address, "places" the order — no payment gateway wired up yet)

## Running it
```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm run start   # production build
```

## Known limitations / next steps
1. **3D model**: only one t-shirt `.glb` model was included in the project, so every garment category (hoodie, polo, sweatshirt, etc.) currently previews on that same shirt shape. Drop in additional `.glb` models per category and swap them in `components/TShirtViewer.jsx` for accurate previews.
2. **Checkout**: there's no payment gateway or backend/order database yet — "Place Order" on `/cart` just simulates success. Wire this up to Stripe/Razorpay + a real backend (or a form service) when you're ready to take real orders.
3. **Contact form**: currently opens the visitor's email client (`mailto:`) rather than sending through a backend. Swap in a form service (Formspree, Resend) or your own API route for a smoother experience.
4. **Product images / print gallery**: product photos are stock Unsplash images and the print gallery designs are simple placeholder SVGs — swap in your real product photography and artwork.
5. **Cart persistence**: cart data is stored in the browser's `localStorage`, so it's per-device/per-browser (no account system yet).

## Update — fixed decal rendering + added Supabase for importing print designs

### What was actually broken
This upload was on an earlier snapshot missing a prior fix: the 12 built-in
print gallery SVGs had no explicit `width`/`height`, which some browsers need
to turn an SVG into a usable 3D texture. Without it, a gallery-picked design
could silently fail to ever appear on the shirt. That's fixed here (copied
over the corrected SVGs).

On top of that, the texture-loading path has been made more robust:
- Switched from drei's `useTexture` (Suspense-coupled, and failures were
  easy to lose track of) to a manual loader that logs a clear error to the
  browser console if an image ever fails to load, instead of the design
  just silently never showing up. If you still see nothing after picking a
  design, open the browser console (F12) — you'll now see exactly why.
- Fixed the decal's `mesh` reference being recreated on every render, which
  was causing the decal to tear down and rebuild constantly instead of only
  when the actual mesh changes.

No layout, design, or UI changes were made — only the underlying rendering
and design-source logic.

### Supabase — importing your own print designs

Install is already done (`@supabase/supabase-js`). To connect it:

1. **Create a table** in your Supabase project's SQL editor:

```sql
create table print_designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  image_url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Allow the public (anon) key to read active designs — required for the
-- gallery to load on the storefront.
alter table print_designs enable row level security;
create policy "Public can read active designs"
  on print_designs for select
  using (is_active = true);
```

2. **Create a Storage bucket** named `print-designs` and make it **public**
   (Storage → New bucket → toggle "Public bucket"). Upload your design
   images there.

3. For each image, grab its public URL (Storage → the file → "Get URL") and
   insert a row:

```sql
insert into print_designs (name, category, image_url)
values ('My Cool Design', 'Streetwear', 'https://your-project-ref.supabase.co/storage/v1/object/public/print-designs/my-design.png');
```

   `category` is optional — leave it blank and it'll show up under an
   "Uploaded" tab in the gallery, or set it to match one of the existing
   tabs (Typography, Streetwear, Minimal, Nature, Doodle) to fold it into
   an existing one.

4. **Copy `.env.local.example` to `.env.local`** and fill in your project's
   URL and anon key (Project Settings → API in the Supabase dashboard), then
   restart `npm run dev`.

Once connected, anything you add to that table (with `is_active = true`)
shows up automatically in the "Choose a Print" gallery on the Customize
page, merged in alongside the built-in designs — no code changes needed to
add more later.

## Update — interactive drag-to-place design editor

Added a new `components/DesignPlacementEditor.tsx`: a "Position Guide" panel
that shows both the front and back of the garment as flat outlines, with the
design shown directly on whichever side it's currently assigned to.

- **Drag the design** to move it around
- **Drag the small circular handle** on its bottom-right corner to resize it
- **Tap the other side's thumbnail** to move the design there instead
- The existing sliders (Size, Move Left/Right, Move Up/Down, Rotation) still
  work and stay in sync with dragging — useful for precise/keyboard-only
  adjustments, or fine-tuning rotation (no rotate handle yet).

This drives the exact same `offsetX` / `offsetY` / `scale` state that was
already feeding the 3D decal, so placement stays consistent between the flat
guide and the 3D preview.

## Update — fixed the floating decal, switched gallery to JPG, simplified placement controls

### The "print floating off the shirt in 3D" bug
This model has layered mesh construction (an outer shell with an inner
lining mesh very close behind it in places). Drei's `Decal` component
defaults to `depthTest: false`, meaning the design always renders on top of
everything regardless of actual depth — so if the decal's nearest-surface
search ever landed on the inner layer instead of the outer one, it rendered
straight through the visible fabric, looking like a disconnected floating
sticker instead of sitting on the shirt. Explicitly set `depthTest` to `true`
on the decal material so a misplaced case like that is correctly hidden
behind the outer surface instead of floating in front of it.

Also tightened the placement range (both the sliders and the drag editor)
back to a safer ±0.8, since positions near the very edges of the printable
area are more likely to catch awkward mesh geometry.

### Gallery designs are now JPG, not SVG
Per your note that Supabase-hosted designs will all be JPGs, the 12
built-in gallery designs were converted from SVG to JPG (800×800, white
background) and `lib/designs.ts` updated to match. This also sidesteps any
SVG-as-texture browser quirks entirely going forward.

### Simplified placement controls
- Removed the resize handle and the Size slider — designs are no longer
  resizable, per your request.
- Move + rotate controls (both the drag-to-move on the Position Guide and
  the sliders) are now only available for **uploaded** designs. Designs
  chosen from **Choose a Print** (gallery) are locked to a fixed, centered
  placement — the Placement panel for those just shows a Front/Back toggle
  and Remove button, with a note explaining the print is fixed-size.

## Fixing design alignment — two ways

### Option A: tune the numbers directly (fastest, no Blender needed)
The alignment logic lives in `components/TShirtViewer.jsx`, in the `anchor`
`useMemo` inside `TShirtModel` (search for "Alignment: this is the part that
decides WHERE the design sits"). When no Blender anchor exists (see Option B),
it estimates a chest/upper-back point from the model's overall bounding box:

```js
const zPos = isBack
  ? modelBox.min.z + size.z * 0.12   // how far in from the BACK face
  : modelBox.max.z - size.z * 0.12;  // how far in from the FRONT face
return {
  position: [
    c.x + (decal.offsetX || 0) * size.x * 0.5,
    c.y + size.y * 0.12 + (decal.offsetY || 0) * size.y * 0.5, // 0.12 = height above vertical center
    zPos,
  ],
  printWidth: Math.min(size.x, size.y) * 0.55, // starting design width
  ...
};
```

- Design sitting too high/low → change the `0.12` next to `size.y * 0.12`
  (bigger = higher up the chest)
- Design sitting too far left/right by default → the `c.x` term has no
  offset by default, so this shouldn't drift, but if it does, add a small
  constant like `c.x + 0.05`
- Design too big/small by default → change the `0.55` multiplier in
  `printWidth`
- Design floating instead of hugging the curve → increase `0.12` in the
  `zPos` lines (pushes the anchor further into the mesh, away from the
  edge)

This is a guess based on the model's bounding box, so it'll never be pixel
perfect — which is why Option B exists.

### Option B: place an exact marker in Blender (reliable, recommended)
This removes the guesswork entirely. Steps:

1. **Open the model in Blender.** If you don't have the original `.blend`,
   just import `public/tshirt.glb` directly (File → Import → glTF 2.0).

2. **Find the exact chest point.** Switch to Edit Mode on the shirt mesh,
   select a vertex or face roughly where you want the design centered,
   then `Shift+S` → "Cursor to Selected" to snap the 3D cursor there.

3. **Add a marker object at the cursor.** `Shift+A` → Empty → Plain Axes
   (or a small Plane if you prefer something visible while you work). It
   will spawn at the 3D cursor position.

4. **Orient it to face outward.** Rotate the empty so its local +Z axis
   points away from the body (outward, the direction the design should
   face). Eyeball this against the viewport — small errors here are fine,
   since it only affects the fallback's projection depth, not Option B's
   accuracy for position.

5. **Name it exactly:**
   - `DecalAnchor_Front` for the front placement point
   - `DecalAnchor_Back` for the back placement point

6. **Export.** File → Export → glTF 2.0 (.glb), overwrite
   `public/tshirt.glb`. Empty objects export as plain nodes by default —
   no special export option needed.

7. **Done.** The code in `TShirtViewer.jsx` already looks for objects named
   exactly `DecalAnchor_Front` / `DecalAnchor_Back` on every load. If it
   finds them, it uses their exact Blender position + rotation instead of
   the estimate — no code changes needed on your end. If you only add one
   of the two (say, just Front), Back keeps using the fallback estimate
   until you add that one too.

You can iterate freely — nudge the empty in Blender, re-export, refresh the
browser, repeat — without touching any code.

## Admin CMS — Orders + Design Management

A full admin panel has been added at **`/admin`** (not linked from the
storefront navigation on purpose — bookmark it). It covers:

- **`/admin/orders`** — every order placed on the site, filterable by status
  (Order Received, Processing, Printing, Shipped, Delivered, Cancelled),
  with counts per status.
- **`/admin/orders/[id]`** — full order detail: customer name/phone/address,
  every line item, and for custom items, **the actual design file the
  customer used** (viewable and downloadable), plus its placement (front/back,
  offset, rotation). A dropdown lets you move the order through its
  status pipeline.
- **`/admin/designs`** — manage the "Choose a Print" gallery: upload new
  designs, toggle them active/hidden, or delete them. These show up on the
  storefront immediately, no code changes needed.

The storefront's Navbar/Footer are hidden on any `/admin/*` route so it
reads as a separate tool, not part of the shop.

### 1. Database setup
Run this in your Supabase project's SQL editor, in addition to the
`print_designs` table from the earlier Supabase section above:

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  email text,
  status text not null default 'received',
  total_price numeric not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_name text not null,
  color text,
  color_label text,
  size text,
  qty integer not null default 1,
  price numeric not null,
  is_custom boolean default false,
  design_name text,
  design_image_url text,
  design_side text,
  design_offset_x numeric,
  design_offset_y numeric,
  design_rotation numeric,
  created_at timestamptz default now()
);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Customers (using the public anon key) can only CREATE orders — they
-- can't read, edit, or delete any order, including their own or anyone
-- else's, once placed.
create policy "Public can create orders"
  on orders for insert with check (true);
create policy "Public can create order items"
  on order_items for insert with check (true);

-- Only signed-in admins (see step 3 below) can read or update orders.
create policy "Admins can read orders"
  on orders for select using (auth.role() = 'authenticated');
create policy "Admins can update orders"
  on orders for update using (auth.role() = 'authenticated');
create policy "Admins can read order items"
  on order_items for select using (auth.role() = 'authenticated');
```

### 2. Storage bucket for order design files
Storage → New bucket → name it **`order-designs`** → make it **public**
(needed so the admin panel and download links can load the image directly).
Nothing else to configure — the code uploads to it automatically whenever a
customer checks out with an uploaded design.

(This is separate from the `print-designs` bucket from the earlier Supabase
section, which is for the gallery designs you manage in `/admin/designs`.)

### 3. Create your admin login
Supabase dashboard → Authentication → Users → **Add user** → enter the
email/password you want to log into `/admin` with. Untick "Auto Confirm
User" only if you want to verify by email first — for a single internal
admin account, checking "Auto Confirm User" is simplest.

That's it — go to `yoursite.com/admin/login` and sign in with those
credentials.

### How order status works
Every new order starts as **Order Received**. From the order detail page,
move it through: Processing → Printing → Shipped → Delivered (or
Cancelled at any point). Customers aren't notified automatically on status
change yet — that would need an email/SMS integration (e.g. Resend, Twilio)
wired into `updateOrderStatus()` in `lib/orders.ts` if you want that later.

### A note on admin security
This admin auth check happens in the browser (client-side redirect if
you're not signed in) — normal and fine for a small internal tool, but it
means the *page shell* briefly loads before redirecting an unauthenticated
visitor. The actual data is safe regardless: Supabase's Row Level Security
policies above are what really protect it — without a valid signed-in
session, the database itself refuses to return any order or order_item
rows, no matter what the page does.

## Update — Shop by Design

`/shop` now has a **Products / Designs** toggle at the top.

- **Designs view** shows every design in your gallery (both the built-in
  ones and anything you've added via `/admin/designs`), with the same
  category filtering as the Customize page's "Choose a Print".
- **Clicking a design** takes you straight to `/customize` with that design
  already applied to the shirt in the 3D preview — garment, color, and size
  are right there to pick, exactly like starting from a blank customization
  but with the design pre-loaded instead of empty.

No new setup needed — it reads from the same design gallery (local +
Supabase) that's already wired up.

## Update — homepage content revamp

The homepage had leftover content from other, unrelated template projects
mixed in — a video-marketing SaaS hero ("Engage Audiences with Stunning
Videos... 100,000 happy creators") and an entire Nepali food/pickle brand
section ("हजुरआमाको स्वाद... Gorkhali spirit"). That's the real reason it felt
empty/off — it was showing unrelated businesses, not a styling problem.

Changes:
- **Removed** `components/sections/messageSection.tsx` entirely (the food
  brand section) — it also depended on GSAP's premium SplitText plugin for
  no real reason.
- **Rewrote** `components/sections/homepage.tsx` from the fake video-SaaS
  hero into a proper "How It Works" section (Pick a garment → Add your
  design → Preview it live → We print & ship), which was actually missing
  before — a custom-print site needs to explain the process.
- **Replaced** the fake "Prompt engineers / Data scientists / Software
  engineers" showcase cards with a real **Popular Designs** section pulling
  actual designs from your gallery, linking into the customizer.
- **Added** a "Shop by Design" banner CTA (upload your own vs. browse the
  gallery) tying into the Shop's Designs tab from before.
- **Replaced** all testimonial text (previously about "Rad.Clo components"
  for frontend/backend engineers) with real custom-apparel customer
  feedback, and swapped the video-testimonial card (with a non-functional
  play button) for a plain photo testimonial.
- **Replaced** the entire FAQ (previously about SaaS pricing plans, a "2%
  donation" program, and Slack/Trello integrations) with real questions:
  turnaround time, file formats, minimum order quantity, print method
  (DTF), front/back pricing, sizing, returns on custom items, and order
  tracking.

Nothing in Hero.tsx needed changing — it was already properly customized.

## Update — fixed decal rendering + added Supabase for importing print designs

### What was actually broken
This upload was on an earlier snapshot missing a prior fix: the 12 built-in
print gallery SVGs had no explicit `width`/`height`, which some browsers need
to turn an SVG into a usable 3D texture. Without it, a gallery-picked design
could silently fail to ever appear on the shirt. That's fixed here (copied
over the corrected SVGs).

On top of that, the texture-loading path has been made more robust:
- Switched from drei's `useTexture` (Suspense-coupled, and failures were
  easy to lose track of) to a manual loader that logs a clear error to the
  browser console if an image ever fails to load, instead of the design
  just silently never showing up. If you still see nothing after picking a
  design, open the browser console (F12) — you'll now see exactly why.
- Fixed the decal's `mesh` reference being recreated on every render, which
  was causing the decal to tear down and rebuild constantly instead of only
  when the actual mesh changes.

No layout, design, or UI changes were made — only the underlying rendering
and design-source logic.

### Supabase — importing your own print designs

Install is already done (`@supabase/supabase-js`). To connect it:

1. **Create a table** in your Supabase project's SQL editor:

```sql
create table print_designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  image_url text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Allow the public (anon) key to read active designs — required for the
-- gallery to load on the storefront.
alter table print_designs enable row level security;
create policy "Public can read active designs"
  on print_designs for select
  using (is_active = true);
```

2. **Create a Storage bucket** named `print-designs` and make it **public**
   (Storage → New bucket → toggle "Public bucket"). Upload your design
   images there.

3. For each image, grab its public URL (Storage → the file → "Get URL") and
   insert a row:

```sql
insert into print_designs (name, category, image_url)
values ('My Cool Design', 'Streetwear', 'https://your-project-ref.supabase.co/storage/v1/object/public/print-designs/my-design.png');
```

   `category` is optional — leave it blank and it'll show up under an
   "Uploaded" tab in the gallery, or set it to match one of the existing
   tabs (Typography, Streetwear, Minimal, Nature, Doodle) to fold it into
   an existing one.

4. **Copy `.env.local.example` to `.env.local`** and fill in your project's
   URL and anon key (Project Settings → API in the Supabase dashboard), then
   restart `npm run dev`.

Once connected, anything you add to that table (with `is_active = true`)
shows up automatically in the "Choose a Print" gallery on the Customize
page, merged in alongside the built-in designs — no code changes needed to
add more later.

## Update — interactive drag-to-place design editor

Added a new `components/DesignPlacementEditor.tsx`: a "Position Guide" panel
that shows both the front and back of the garment as flat outlines, with the
design shown directly on whichever side it's currently assigned to.

- **Drag the design** to move it around
- **Drag the small circular handle** on its bottom-right corner to resize it
- **Tap the other side's thumbnail** to move the design there instead
- The existing sliders (Size, Move Left/Right, Move Up/Down, Rotation) still
  work and stay in sync with dragging — useful for precise/keyboard-only
  adjustments, or fine-tuning rotation (no rotate handle yet).

This drives the exact same `offsetX` / `offsetY` / `scale` state that was
already feeding the 3D decal, so placement stays consistent between the flat
guide and the 3D preview.

## Update — fixed the floating decal, switched gallery to JPG, simplified placement controls

### The "print floating off the shirt in 3D" bug
This model has layered mesh construction (an outer shell with an inner
lining mesh very close behind it in places). Drei's `Decal` component
defaults to `depthTest: false`, meaning the design always renders on top of
everything regardless of actual depth — so if the decal's nearest-surface
search ever landed on the inner layer instead of the outer one, it rendered
straight through the visible fabric, looking like a disconnected floating
sticker instead of sitting on the shirt. Explicitly set `depthTest` to `true`
on the decal material so a misplaced case like that is correctly hidden
behind the outer surface instead of floating in front of it.

Also tightened the placement range (both the sliders and the drag editor)
back to a safer ±0.8, since positions near the very edges of the printable
area are more likely to catch awkward mesh geometry.

### Gallery designs are now JPG, not SVG
Per your note that Supabase-hosted designs will all be JPGs, the 12
built-in gallery designs were converted from SVG to JPG (800×800, white
background) and `lib/designs.ts` updated to match. This also sidesteps any
SVG-as-texture browser quirks entirely going forward.

### Simplified placement controls
- Removed the resize handle and the Size slider — designs are no longer
  resizable, per your request.
- Move + rotate controls (both the drag-to-move on the Position Guide and
  the sliders) are now only available for **uploaded** designs. Designs
  chosen from **Choose a Print** (gallery) are locked to a fixed, centered
  placement — the Placement panel for those just shows a Front/Back toggle
  and Remove button, with a note explaining the print is fixed-size.

## Fixing design alignment — two ways

### Option A: tune the numbers directly (fastest, no Blender needed)
The alignment logic lives in `components/TShirtViewer.jsx`, in the `anchor`
`useMemo` inside `TShirtModel` (search for "Alignment: this is the part that
decides WHERE the design sits"). When no Blender anchor exists (see Option B),
it estimates a chest/upper-back point from the model's overall bounding box:

```js
const zPos = isBack
  ? modelBox.min.z + size.z * 0.12   // how far in from the BACK face
  : modelBox.max.z - size.z * 0.12;  // how far in from the FRONT face
return {
  position: [
    c.x + (decal.offsetX || 0) * size.x * 0.5,
    c.y + size.y * 0.12 + (decal.offsetY || 0) * size.y * 0.5, // 0.12 = height above vertical center
    zPos,
  ],
  printWidth: Math.min(size.x, size.y) * 0.55, // starting design width
  ...
};
```

- Design sitting too high/low → change the `0.12` next to `size.y * 0.12`
  (bigger = higher up the chest)
- Design sitting too far left/right by default → the `c.x` term has no
  offset by default, so this shouldn't drift, but if it does, add a small
  constant like `c.x + 0.05`
- Design too big/small by default → change the `0.55` multiplier in
  `printWidth`
- Design floating instead of hugging the curve → increase `0.12` in the
  `zPos` lines (pushes the anchor further into the mesh, away from the
  edge)

This is a guess based on the model's bounding box, so it'll never be pixel
perfect — which is why Option B exists.

### Option B: place an exact marker in Blender (reliable, recommended)
This removes the guesswork entirely. Steps:

1. **Open the model in Blender.** If you don't have the original `.blend`,
   just import `public/tshirt.glb` directly (File → Import → glTF 2.0).

2. **Find the exact chest point.** Switch to Edit Mode on the shirt mesh,
   select a vertex or face roughly where you want the design centered,
   then `Shift+S` → "Cursor to Selected" to snap the 3D cursor there.

3. **Add a marker object at the cursor.** `Shift+A` → Empty → Plain Axes
   (or a small Plane if you prefer something visible while you work). It
   will spawn at the 3D cursor position.

4. **Orient it to face outward.** Rotate the empty so its local +Z axis
   points away from the body (outward, the direction the design should
   face). Eyeball this against the viewport — small errors here are fine,
   since it only affects the fallback's projection depth, not Option B's
   accuracy for position.

5. **Name it exactly:**
   - `DecalAnchor_Front` for the front placement point
   - `DecalAnchor_Back` for the back placement point

6. **Export.** File → Export → glTF 2.0 (.glb), overwrite
   `public/tshirt.glb`. Empty objects export as plain nodes by default —
   no special export option needed.

7. **Done.** The code in `TShirtViewer.jsx` already looks for objects named
   exactly `DecalAnchor_Front` / `DecalAnchor_Back` on every load. If it
   finds them, it uses their exact Blender position + rotation instead of
   the estimate — no code changes needed on your end. If you only add one
   of the two (say, just Front), Back keeps using the fallback estimate
   until you add that one too.

You can iterate freely — nudge the empty in Blender, re-export, refresh the
browser, repeat — without touching any code.

## Admin CMS — Orders + Design Management

A full admin panel has been added at **`/admin`** (not linked from the
storefront navigation on purpose — bookmark it). It covers:

- **`/admin/orders`** — every order placed on the site, filterable by status
  (Order Received, Processing, Printing, Shipped, Delivered, Cancelled),
  with counts per status.
- **`/admin/orders/[id]`** — full order detail: customer name/phone/address,
  every line item, and for custom items, **the actual design file the
  customer used** (viewable and downloadable), plus its placement (front/back,
  offset, rotation). A dropdown lets you move the order through its
  status pipeline.
- **`/admin/designs`** — manage the "Choose a Print" gallery: upload new
  designs, toggle them active/hidden, or delete them. These show up on the
  storefront immediately, no code changes needed.

The storefront's Navbar/Footer are hidden on any `/admin/*` route so it
reads as a separate tool, not part of the shop.

### 1. Database setup
Run this in your Supabase project's SQL editor, in addition to the
`print_designs` table from the earlier Supabase section above:

```sql
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  email text,
  status text not null default 'received',
  total_price numeric not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_name text not null,
  color text,
  color_label text,
  size text,
  qty integer not null default 1,
  price numeric not null,
  is_custom boolean default false,
  design_name text,
  design_image_url text,
  design_side text,
  design_offset_x numeric,
  design_offset_y numeric,
  design_rotation numeric,
  created_at timestamptz default now()
);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Customers (using the public anon key) can only CREATE orders — they
-- can't read, edit, or delete any order, including their own or anyone
-- else's, once placed.
create policy "Public can create orders"
  on orders for insert with check (true);
create policy "Public can create order items"
  on order_items for insert with check (true);

-- Only signed-in admins (see step 3 below) can read or update orders.
create policy "Admins can read orders"
  on orders for select using (auth.role() = 'authenticated');
create policy "Admins can update orders"
  on orders for update using (auth.role() = 'authenticated');
create policy "Admins can read order items"
  on order_items for select using (auth.role() = 'authenticated');
```

### 2. Storage bucket for order design files
Storage → New bucket → name it **`order-designs`** → make it **public**
(needed so the admin panel and download links can load the image directly).
Nothing else to configure — the code uploads to it automatically whenever a
customer checks out with an uploaded design.

(This is separate from the `print-designs` bucket from the earlier Supabase
section, which is for the gallery designs you manage in `/admin/designs`.)

### 3. Create your admin login
Supabase dashboard → Authentication → Users → **Add user** → enter the
email/password you want to log into `/admin` with. Untick "Auto Confirm
User" only if you want to verify by email first — for a single internal
admin account, checking "Auto Confirm User" is simplest.

That's it — go to `yoursite.com/admin/login` and sign in with those
credentials.

### How order status works
Every new order starts as **Order Received**. From the order detail page,
move it through: Processing → Printing → Shipped → Delivered (or
Cancelled at any point). Customers aren't notified automatically on status
change yet — that would need an email/SMS integration (e.g. Resend, Twilio)
wired into `updateOrderStatus()` in `lib/orders.ts` if you want that later.

### A note on admin security
This admin auth check happens in the browser (client-side redirect if
you're not signed in) — normal and fine for a small internal tool, but it
means the *page shell* briefly loads before redirecting an unauthenticated
visitor. The actual data is safe regardless: Supabase's Row Level Security
policies above are what really protect it — without a valid signed-in
session, the database itself refuses to return any order or order_item
rows, no matter what the page does.

## Update — Shop by Design

`/shop` now has a **Products / Designs** toggle at the top.

- **Designs view** shows every design in your gallery (both the built-in
  ones and anything you've added via `/admin/designs`), with the same
  category filtering as the Customize page's "Choose a Print".
- **Clicking a design** takes you straight to `/customize` with that design
  already applied to the shirt in the 3D preview — garment, color, and size
  are right there to pick, exactly like starting from a blank customization
  but with the design pre-loaded instead of empty.

No new setup needed — it reads from the same design gallery (local +
Supabase) that's already wired up.


## Update — homepage content revamp

The homepage had leftover content from other, unrelated template projects
mixed in — a video-marketing SaaS hero ("Engage Audiences with Stunning
Videos... 100,000 happy creators") and an entire Nepali food/pickle brand
section ("हजुरआमाको स्वाद... Gorkhali spirit"). That's the real reason it felt
empty/off — it was showing unrelated businesses, not a styling problem.

Changes:
- **Removed** `components/sections/messageSection.tsx` entirely (the food
  brand section) — it also depended on GSAP's premium SplitText plugin for
  no real reason.
- **Rewrote** `components/sections/homepage.tsx` from the fake video-SaaS
  hero into a proper "How It Works" section (Pick a garment → Add your
  design → Preview it live → We print & ship), which was actually missing
  before — a custom-print site needs to explain the process.
- **Replaced** the fake "Prompt engineers / Data scientists / Software
  engineers" showcase cards with a real **Popular Designs** section pulling
  actual designs from your gallery, linking into the customizer.
- **Added** a "Shop by Design" banner CTA (upload your own vs. browse the
  gallery) tying into the Shop's Designs tab from before.
- **Replaced** all testimonial text (previously about "Rad.Clo components"
  for frontend/backend engineers) with real custom-apparel customer
  feedback, and swapped the video-testimonial card (with a non-functional
  play button) for a plain photo testimonial.
- **Replaced** the entire FAQ (previously about SaaS pricing plans, a "2%
  donation" program, and Slack/Trello integrations) with real questions:
  turnaround time, file formats, minimum order quantity, print method
  (DTF), front/back pricing, sizing, returns on custom items, and order
  tracking.

Nothing in Hero.tsx needed changing — it was already properly customized.

