import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, ArrowUpRight, Plus, Star, MessageCircle } from "lucide-react";
import { getStorefront } from "@/lib/server/store";
import { formatPrice, visibleGarments } from "@/lib/garments";
import HeroPlayground from "@/components/home/HeroPlayground";
import CategoryExplorer from "@/components/home/CategoryExplorer";
import WaysToCreate from "@/components/home/WaysToCreate";
import PriceBuilder from "@/components/home/PriceBuilder";
import MagneticLink from "@/components/home/MagneticLink";

const TICKER = ["Front", "Back", "Sleeves", "Live 3D preview", "No minimum order", "Wash-tested inks", "Bulk pricing", "Made to order"];

const TESTIMONIALS = [
  { text: "Checked my sketch on the 3D preview — the tee looked exactly the same when it arrived.", name: "Aarav S.", role: "Custom oversized tee" },
  { text: "60 hoodies for our college fest. Fair bulk pricing and every piece arrived on time.", name: "Riya K.", role: "Event organiser" },
  { text: "No minimum order meant I could launch my label without stocking up.", name: "Kabir M.", role: "Brand founder" },
  { text: "Put our logo on the chest and names on the back. The position guide made it so easy.", name: "Neha P.", role: "Team lead" },
];

const FAQS = [
  ["What file types can I upload?", "PNG, JPG and WEBP. For the cleanest print, upload a transparent PNG at least 2000px wide."],
  ["Is there a minimum order?", "No — order a single piece. Orders of 20+ get bulk pricing; tell us the quantity on the contact page."],
  ["How long does it take?", "Most orders are printed within 3–5 working days, plus 2–5 days for delivery depending on your location."],
  ["Will the print fade or crack?", "Our prints are wash-tested for 50+ cycles. Wash inside out in cold water and don't iron directly on the print."],
  ["Where can I print?", "On the front, the back and either sleeve — each priced separately. Drag, resize and rotate your design and preview it in 3D."],
  ["How do I pay?", "After you place your order, we confirm the design and details with you and share payment options before printing."],
];

export default async function Home() {
  await connection(); // designs and prices are managed live from /admin
  const { categories, designs, pricing } = await getStorefront();
  const featured = designs.filter((d) => d.featured);
  const heroDesigns = (featured.length ? featured : designs).slice(0, 8);
  const wallA = designs.filter((_, i) => i % 2 === 0);
  const wallB = designs.filter((_, i) => i % 2 === 1);

  return (
    <div className="bg-paper overflow-x-clip">
      <HeroPlayground designs={heroDesigns} pricing={pricing} />

      {/* ── Ticker band ── */}
      <div className="relative z-10 -mt-8 -mx-4 rotate-[-2deg] bg-lime text-ink py-4 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)]">
        <div className="marquee flex w-max whitespace-nowrap font-black uppercase text-xl md:text-2xl tracking-[-0.03em]">
          {[0, 1].map((k) => (
            <div key={k} className="flex items-center" aria-hidden={k === 1}>
              {TICKER.map((w) => (
                <span key={w} className="flex items-center">
                  <span className="px-7">{w}</span>
                  <span className="text-2xl">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── The Drop ── */}
      <section className="max-w-7xl mx-auto px-6 pt-28 pb-24">
        <Heading eyebrow="The drop" title={<>Original prints,<br />ready to wear.</>} href="/shop" link="All designs" />
        <CategoryExplorer categories={categories} designs={designs} pricing={pricing} />
      </section>

      {/* ── Ways to create ── */}
      <section id="how" className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-20">
        <Heading eyebrow="How it works" title={<>Three ways<br />to make it yours.</>} />
        <WaysToCreate />
      </section>

      {/* ── Design wall ── */}
      {designs.length > 3 && (
        <section className="bg-ink text-white py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">The design store</p>
              <h2 className="font-black uppercase text-[clamp(36px,5.5vw,80px)] leading-[0.92] tracking-[-0.045em] mt-3">
                Made by us.
                <br />
                <span className="text-lime">Worn by you.</span>
              </h2>
            </div>
            <p className="text-white/50 max-w-sm">
              {designs.length} original designs across {categories.length} categories — every one printable on any tee, polo,
              hoodie or sweatshirt.
            </p>
          </div>
          <div className="space-y-4 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            {[wallA, wallB].map((row, r) => (
              <div key={r} className={`flex w-max gap-4 hover:[animation-play-state:paused] ${r ? "marquee-reverse" : "marquee-slow"}`}>
                {[...row, ...row].map((d, i) => (
                  <Link
                    key={`${d.id}-${i}`}
                    href={`/customize?design=${d.slug}`}
                    className="group relative shrink-0 w-44 sm:w-52 aspect-square rounded-[24px] bg-white p-5 transition-transform duration-300 hover:-rotate-3 hover:scale-105"
                    aria-hidden={i >= row.length}
                    tabIndex={i >= row.length ? -1 : undefined}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-contain" />
                    <span className="absolute inset-x-3 bottom-3 rounded-full bg-ink text-white text-[11px] font-bold text-center py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.name}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Price builder ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <Heading eyebrow="Pricing" title={<>Price it<br />in seconds.</>} />
        <PriceBuilder pricing={pricing} />
      </section>

      {/* ── Garments ── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <Heading eyebrow="Blanks" title="Pick your canvas" href="/customize" link="Open 3D Studio" />
        <div className="flex gap-4 overflow-x-auto snap-x pb-3 -mx-6 px-6 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
          {visibleGarments(pricing).map((g, i) => (
            <Link
              key={g.slug}
              href={`/customize?garment=${g.slug}`}
              className={`group snap-start shrink-0 w-60 sm:w-auto ${i % 2 ? "lg:translate-y-10" : ""}`}
            >
              <div className="relative aspect-3/4 rounded-[28px] overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.image}
                  alt={g.label}
                  loading="lazy"
                  className="w-full h-full object-cover grayscale-[30%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent" />
                <div className="absolute bottom-4 inset-x-4 text-white">
                  <p className="font-black uppercase tracking-[-0.03em] text-lg leading-none">{g.label}</p>
                  <p className="text-[11px] text-white/70 mt-1">{g.fabric}</p>
                </div>
                <span className="absolute top-3 right-3 rounded-full bg-white px-3 py-1 text-xs font-black">
                  {formatPrice(g.basePrice)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Reviews ── */}
      <section className="pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
            <Heading eyebrow="Reviews" title={<>10,000+ tees<br />and counting.</>} bare />
            <div className="flex gap-3">
              {[
                ["4.8★", "Avg. rating"],
                ["2,000+", "Custom orders"],
                ["50+", "Washes tested"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-2xl bg-white ring-1 ring-black/5 px-5 py-4">
                  <p className="font-black text-2xl tracking-[-0.04em]">{n}</p>
                  <p className="text-[10px] text-muted mt-0.5 uppercase tracking-wider font-bold">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto snap-x px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2+1.5rem))] pb-4">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className={`snap-start shrink-0 w-[300px] sm:w-[380px] rounded-[28px] p-7 flex flex-col ${
                i === 0 ? "bg-ink text-white" : i === 2 ? "bg-lime" : "bg-white ring-1 ring-black/5"
              }`}
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className={`w-4 h-4 ${i === 0 ? "fill-lime text-lime" : "fill-ink text-ink"}`} />
                ))}
              </div>
              <blockquote className="mt-5 text-lg font-semibold leading-snug tracking-[-0.01em]">“{t.text}”</blockquote>
              <figcaption className="mt-auto pt-8 flex items-center gap-3 text-sm">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${i === 0 ? "bg-lime text-ink" : "bg-ink text-white"}`}>
                  {t.name[0]}
                </span>
                <span>
                  <span className="block font-bold">{t.name}</span>
                  <span className="block text-xs opacity-60">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-20 grid lg:grid-cols-[0.8fr_1.2fr] gap-10">
        <div>
          <Heading eyebrow="FAQ" title={<>Good<br />questions.</>} bare />
          <div className="mt-8 rounded-[28px] bg-white ring-1 ring-black/5 p-6">
            <MessageCircle className="w-6 h-6" />
            <p className="font-black uppercase tracking-[-0.02em] mt-4">Ordering 20+ pieces?</p>
            <p className="text-sm text-muted mt-1">Teams, events and brands get tiered pricing and free design help.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 mt-5 rounded-full bg-ink text-white text-xs font-bold px-5 py-3 hover:bg-flame transition-colors">
              GET A BULK QUOTE <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        <div className="space-y-2.5">
          {FAQS.map(([q, a], i) => (
            <details key={q} open={i === 0} className="group rounded-[22px] bg-white ring-1 ring-black/5 px-6 open:ring-ink transition">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-5 font-bold [&::-webkit-details-marker]:hidden">
                {q}
                <span className="w-8 h-8 shrink-0 rounded-full bg-paper flex items-center justify-center group-open:bg-lime transition-colors">
                  <Plus className="w-4 h-4 transition-transform duration-300 group-open:rotate-45" />
                </span>
              </summary>
              <p className="text-sm text-muted pb-5 -mt-1 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 sm:px-6 pb-6">
        <div className="relative max-w-7xl mx-auto rounded-[40px] bg-ink text-white px-6 pt-20 pb-24 text-center overflow-hidden">
          <div className="absolute inset-0 grain opacity-[0.12] pointer-events-none" />
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-48 w-[760px] h-[380px] rounded-full bg-flame/45 blur-[110px]" />
          <p className="relative text-[11px] font-bold uppercase tracking-[0.25em] text-white/40">Your next favourite tee</p>
          <h2 className="relative font-black uppercase text-[clamp(48px,9vw,140px)] leading-[0.86] tracking-[-0.055em] mt-5">
            Wear your
            <br />
            <span className="text-transparent" style={{ WebkitTextStroke: "2px #d4ff3a" }}>
              story
            </span>{" "}
            out loud.
          </h2>
          <div className="relative mt-12 flex justify-center">
            <MagneticLink href="/customize" className="group items-center gap-3 rounded-full bg-lime text-ink font-black text-sm pl-8 pr-2 py-2">
              START DESIGNING
              <span className="w-12 h-12 rounded-full bg-ink text-lime flex items-center justify-center transition-transform group-hover:rotate-[-45deg]">
                <ArrowRight className="w-5 h-5" />
              </span>
            </MagneticLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function Heading({
  eyebrow,
  title,
  href,
  link,
  bare,
}: {
  eyebrow: string;
  title: React.ReactNode;
  href?: string;
  link?: string;
  /** No bottom margin / link row (when placed inside another layout) */
  bare?: boolean;
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${bare ? "" : "mb-12"}`}>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-muted">{eyebrow}</p>
        <h2 className="font-black uppercase text-[clamp(36px,5.2vw,76px)] leading-[0.92] tracking-[-0.045em] mt-3">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden sm:inline-flex shrink-0 items-center gap-2 rounded-full ring-1 ring-ink text-xs font-bold pl-5 pr-1.5 py-1.5 hover:bg-ink hover:text-white transition-colors"
        >
          {link?.toUpperCase()}
          <span className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center group-hover:bg-lime group-hover:text-ink transition-colors">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </Link>
      )}
    </div>
  );
}
