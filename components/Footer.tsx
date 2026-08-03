"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SocialIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d={d} />
  </svg>
);

const SOCIALS = [
  {
    label: "Instagram",
    d: "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.256 1.216.598 1.772 1.153a4.9 4.9 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.05 1.066.06 1.405.06 4.122s-.01 3.056-.06 4.122c-.05 1.065-.218 1.79-.465 2.428a4.9 4.9 0 0 1-1.153 1.772 4.9 4.9 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.05-1.405.06-4.122.06s-3.056-.01-4.122-.06c-1.065-.05-1.79-.218-2.428-.465a4.9 4.9 0 0 1-1.772-1.153 4.9 4.9 0 0 1-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.01 15.056 2 14.717 2 12s.01-3.056.06-4.122c.05-1.065.217-1.79.465-2.428A4.9 4.9 0 0 1 3.678 3.678 4.9 4.9 0 0 1 5.45 2.525c.637-.248 1.363-.415 2.428-.465C8.944 2.01 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.25A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5zM18.4 5.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z",
  },
  {
    label: "Facebook",
    d: "M13.5 21v-7.5H16l.5-3H13.5V8.2c0-.87.24-1.46 1.5-1.46H16.6V4.14C16.33 4.1 15.4 4 14.3 4c-2.3 0-3.8 1.4-3.8 3.95V10.5H8v3h2.5V21h3z",
  },
  {
    label: "Twitter",
    d: "M18.9 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
  },
];

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-white border-t border-neutral-200 pt-16 pb-8 px-4 font-poppins">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <h3 className="text-xl font-extrabold mb-3">Rad.Clo</h3>
          <p className="text-sm text-neutral-600 max-w-xs">
            Custom t-shirts, hoodies and apparel — design your own with our
            live 3D preview, or pick from our curated print gallery.
          </p>
          <div className="flex gap-3 mt-5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-neutral-300 flex items-center justify-center hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-colors"
              >
                <SocialIcon d={s.d} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-4">Shop</h3>
          <ul className="space-y-3 text-sm text-neutral-600">
            <li><Link href="/shop" className="hover:text-neutral-900">All Products</Link></li>
            <li><Link href="/shop?category=oversized-tees" className="hover:text-neutral-900">Oversized Tees</Link></li>
            <li><Link href="/shop?category=hoodies" className="hover:text-neutral-900">Hoodies</Link></li>
            <li><Link href="/customize" className="hover:text-neutral-900">Customize</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-4">Company</h3>
          <ul className="space-y-3 text-sm text-neutral-600">
            <li><Link href="/#about" className="hover:text-neutral-900">About</Link></li>
            <li><Link href="/contact" className="hover:text-neutral-900">Contact Us</Link></li>
            <li><Link href="/cart" className="hover:text-neutral-900">Your Cart</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-sm mb-4">Get in touch</h3>
          <ul className="space-y-3 text-sm text-neutral-600">
            <li>hello@radclo.com</li>
            <li>+91 98765 43210</li>
            <li>Mon–Sat, 10am–7pm</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-neutral-500 text-xs">© 2026 Rad.Clo Design</p>
        <p className="text-xs text-neutral-500">All rights reserved.</p>
      </div>
    </footer>
  );
}
