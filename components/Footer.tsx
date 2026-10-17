import Link from "next/link";
import { Mail } from "lucide-react";
import { CONTACT, messengerUrl, phoneDisplay, telUrl, whatsappUrl } from "@/lib/contact";

const brandIcon = (d: string) =>
  function BrandIcon({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d={d} />
      </svg>
    );
  };

const Instagram = brandIcon(
  "M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.256 1.216.598 1.772 1.153a4.9 4.9 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.05 1.066.06 1.405.06 4.122s-.01 3.056-.06 4.122c-.05 1.065-.218 1.79-.465 2.428a4.9 4.9 0 0 1-1.153 1.772 4.9 4.9 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.05-1.405.06-4.122.06s-3.056-.01-4.122-.06c-1.065-.05-1.79-.218-2.428-.465a4.9 4.9 0 0 1-1.772-1.153 4.9 4.9 0 0 1-1.153-1.772c-.247-.637-.415-1.363-.465-2.428C2.01 15.056 2 14.717 2 12s.01-3.056.06-4.122c.05-1.065.217-1.79.465-2.428A4.9 4.9 0 0 1 3.678 3.678 4.9 4.9 0 0 1 5.45 2.525c.637-.248 1.363-.415 2.428-.465C8.944 2.01 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.25A3.25 3.25 0 1 1 12 8.75a3.25 3.25 0 0 1 0 6.5zM18.4 5.4a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"
);
const Facebook = brandIcon(
  "M13.5 21v-7.5H16l.5-3H13.5V8.2c0-.87.24-1.46 1.5-1.46H16.6V4.14C16.33 4.1 15.4 4 14.3 4c-2.3 0-3.8 1.4-3.8 3.95V10.5H8v3h2.5V21h3z"
);

export default function Footer() {
  return (
    <footer className="bg-ink text-paper">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <p className="font-display text-3xl font-extrabold">
              Rad<span className="text-flame">.</span>Clo
            </p>
            <p className="text-sm text-paper/60 mt-3 max-w-xs">
              Custom t-shirt printing in Nepal with a live 3D preview. Pick a design from
              our store or bring your own — printed to order, one piece or five
              hundred.
            </p>
            <div className="flex gap-2 mt-6">
              {[
                { label: "Instagram", Icon: Instagram, href: "#" },
                { label: "Facebook", Icon: Facebook, href: "#" },
                { label: "Email", Icon: Mail, href: "mailto:hello@radclo.com" },
              ].map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-paper/20 flex items-center justify-center hover:bg-lime hover:text-ink hover:border-lime transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Shop"
            links={[
              ["All designs", "/shop"],
              ["3D Studio", "/customize"],
              ["Upload your art", "/customize?mode=upload"],
              ["Add text", "/customize?mode=text"],
            ]}
          />
          <FooterCol
            title="Help"
            links={[
              ["How it works", "/#how"],
              ["FAQ", "/#faq"],
              ["Track an order", "/track"],
              ["My orders", "/account"],
              ["Bulk quote", "/contact#quote"],
              ["Size chart", "/size-guide"],
              ["Your cart", "/cart"],
            ]}
          />
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-paper/40 mb-4">
              Get in touch
            </h3>
            <ul className="space-y-3 text-sm text-paper/70">
              <li>
                <a href={`mailto:${CONTACT.email}`} className="hover:text-paper">{CONTACT.email}</a>
              </li>
              {phoneDisplay && (
                <li>
                  <a href={telUrl} className="hover:text-paper">{phoneDisplay}</a>
                </li>
              )}
              {whatsappUrl() && (
                <li>
                  <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-paper">WhatsApp / Viber</a>
                </li>
              )}
              {messengerUrl && (
                <li>
                  <a href={messengerUrl} target="_blank" rel="noopener noreferrer" className="hover:text-paper">Messenger</a>
                </li>
              )}
              <li>{CONTACT.hours}</li>
            </ul>
          </div>
        </div>

        <p className="font-display font-extrabold text-[22vw] md:text-[16vw] leading-none tracking-tighter text-paper/6 mt-12 select-none text-center">
          RAD.CLO
        </p>

        <div className="pt-6 border-t border-paper/10 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-paper/40">
          <p>© 2026 Rad.Clo. All rights reserved.</p>
          <p>Printed with care, one shirt at a time.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-paper/40 mb-4">{title}</h3>
      <ul className="space-y-3 text-sm text-paper/70">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="hover:text-lime transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
