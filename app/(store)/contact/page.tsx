import type { Metadata } from "next";
import { connection } from "next/server";
import { Mail, Phone, Clock, MessageCircle } from "lucide-react";
import { getPricing } from "@/lib/server/store";
import { visibleGarments } from "@/lib/garments";
import { CONTACT, messengerUrl, phoneDisplay, telUrl, viberUrl, whatsappUrl } from "@/lib/contact";
import BulkQuoteForm from "@/components/BulkQuoteForm";

export const metadata: Metadata = {
  title: "Bulk T-Shirt Printing in Nepal — Contact & Quotes",
  description:
    "Bulk custom t-shirt printing in Nepal for college fests, sports teams, companies and events. Get a quote with tiered pricing and free design help — delivery across Kathmandu and Nepal.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  await connection(); // garments can be hidden from /admin
  const garments = visibleGarments(await getPricing()).map((g) => g.label);

  const channels = [
    whatsappUrl() && { Icon: MessageCircle, title: "WhatsApp", text: phoneDisplay, href: whatsappUrl("Hi Rad.Clo!") },
    viberUrl && { Icon: MessageCircle, title: "Viber", text: phoneDisplay, href: viberUrl },
    messengerUrl && { Icon: MessageCircle, title: "Messenger", text: `m.me/${CONTACT.facebookPage}`, href: messengerUrl },
    telUrl && { Icon: Phone, title: "Call", text: phoneDisplay, href: telUrl },
    { Icon: Mail, title: "Email", text: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { Icon: Clock, title: "Hours", text: CONTACT.hours },
  ].filter(Boolean) as { Icon: typeof Mail; title: string; text: string; href?: string }[];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="max-w-2xl mb-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Contact</p>
        <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight mt-2">Let&apos;s print something.</h1>
        <p className="text-muted mt-4">
          College fests and farewells, futsal and cricket teams, company and event merch, or a question about an
          existing order — we reply within 24 hours.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_1.4fr] gap-10">
        <div className="space-y-3">
          {channels.map(({ Icon, title, text, href }) => {
            const body = (
              <>
                <div className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-muted text-sm mt-0.5">{text}</p>
                </div>
              </>
            );
            return href ? (
              <a
                key={title}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-line hover:border-ink transition-colors"
              >
                {body}
              </a>
            ) : (
              <div key={title} className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-line">
                {body}
              </div>
            );
          })}
          <div className="p-6 rounded-2xl bg-lime">
            <p className="font-display text-xl font-bold">Bulk & team orders</p>
            <p className="text-sm mt-1">
              Ordering 20+ pieces? Tell us the quantity, date and budget — we&apos;ll send tiered pricing and help with
              the design and size split.
            </p>
          </div>
        </div>

        <section id="quote" className="scroll-mt-24">
          <h2 className="font-display text-2xl font-bold mb-4">Get a bulk quote</h2>
          <BulkQuoteForm garments={garments} />
        </section>
      </div>
    </div>
  );
}
