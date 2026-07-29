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
