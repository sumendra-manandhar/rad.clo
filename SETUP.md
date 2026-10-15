# Rad.Clo — Custom T-Shirt Printing

A custom apparel store with a live 3D customizer and an admin dashboard.

## Run it

```bash
npm install
cp .env.local.example .env.local   # then set ADMIN_PASSWORD and SESSION_SECRET
npm run dev                        # http://localhost:3000
```

Production: `npm run build && npm start`. In production the admin login is
refused until `ADMIN_PASSWORD` is set. In `npm run dev` it defaults to `admin123`.

## Pages

| URL | What it does |
| --- | --- |
| `/` | Homepage: 3D hero cycling through featured designs, categories, bestsellers, how it works, FAQ |
| `/shop` | Design store, filterable by category, searchable, sortable |
| `/customize` | Product page for store designs (fixed print spot) and the full-page 3D editor |
| `/cart` | Checkout. Places a real order (payment is confirmed by phone) |
| `/contact` | Contact / bulk-order form (opens the visitor's email app) |
| `/admin` | Dashboard: revenue, new orders, best sellers |
| `/admin/designs` | Upload, edit, price, feature, hide or delete designs |
| `/admin/categories` | Add, rename, reorder and delete categories |
| `/admin/orders` | Every order with its prints, print files, customer details and status |
| `/admin/pricing` | Garments & print areas: show/hide each one, prices, garment names, fabric lines and photos |

Useful studio links: `/customize?design=<slug>`, `?garment=hoodie`,
`?mode=upload`, `?mode=text`, `?color=%231f1f1f`.

## How pricing works

```
price per shirt = garment price
                + each piece used (front / back / sleeves), charged once
                + each store design's own price
shipping        = free from ₹1,499, otherwise ₹99   (lib/garments.ts)
```

Garment and print-area prices are edited at `/admin/pricing`, where each garment and print area can also be hidden (hidden ones disappear from the homepage, studio and checkout, and orders using them are refused). If Front is hidden, store designs print on the Back by default. Each design's
own price is set in `/admin/designs`. The server recalculates every order
from these, so prices sent from the browser are never trusted.

## Studio & print areas

**Store designs** (`/customize?design=<slug>`) open as a simple product page:
the design is printed at a fixed spot (front chest, 11″ wide, centred —
`FIXED_PRINT` in `lib/print-locations.ts`). The customer picks garment,
colour, size and quantity. **Customize** opens the editor.

**The editor** is a full-page studio (opened directly by "Start designing",
`?mode=upload`, `?mode=text`): tools on the left, the 3D shirt in the middle,
and a **Position guide** on the right — the front, back and both sleeves
laid out flat. Designs can be dragged anywhere on it, resized from the
corners and rotated with the top handle; each prints on the piece under its
centre. A piece can hold several designs. Anything left off the pieces is
flagged and not printed.

**Pricing**: each piece with at least one design is charged once (Front,
Back, Left Sleeve, Right Sleeve — admin → Pricing), plus each store design's
own price.

**Orders**: admin → Orders shows each item's position guide exactly as the
customer left it, plus measurements per design (size in inches, distance
from the centre line, top edge below the shoulder line, rotation) and the
print files.

`PRINT_LOCATIONS` in `lib/print-locations.ts` defines each piece: `rect` on
the guide canvas, the real size in `inches` it represents, and `top` (inches
from the shoulder to the top of the piece). If prints land too high or low
on the 3D model, adjust `top` / `inches.h` there.

## Where data is stored

**Default: local files.** Categories, designs, orders and prices live in
`data/db.json`; uploaded images go in `data/uploads/` and are served from
`/api/uploads/...`. The first run seeds the 5 categories and 12 designs from
`public/designs/`. Back up the `data/` folder. It is git-ignored.
This needs a normal server with a writable disk (your own machine, a VPS,
Railway, Render with a disk, etc.).

**Supabase (for Vercel / serverless).** Set `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, run `supabase/schema.sql` in the
SQL editor, and create a public Storage bucket named `print-designs`. The
store switches to Supabase automatically. The Supabase driver hasn't been run
against a live project yet, so try it on a test project first.

## Design files

- Upload transparent PNGs (2000px+) for the best result.
- For JPGs with a plain white background, the 3D preview automatically hides
  white touching the image edges, so it doesn't show as a white square on
  coloured shirts. The original file is what goes to the printer.
- Customer uploads and text designs are saved when they add the item to the
  cart, so each order line links to its exact print files.

## 3D model

`public/tshirt.glb` is used for every garment type. Prints are projected
onto the model with drei's `Decal`, rendered inside each shirt mesh, because
the model's meshes are stored Z-up under a rotated parent node.
See `components/TShirtViewer.jsx`.

## Still to do before launch

- Online payments (Razorpay / Stripe): orders are currently confirmed and
  paid by phone.
- Real product photos, testimonials and stats. The homepage uses placeholders.
- Contact form opens the visitor's email app. Swap in a form service if needed.
- `/api/artwork` accepts public image uploads (needed for the cart). Add rate
  limiting if it gets abused.
