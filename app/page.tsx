"use client";

import { PointerHighlight } from "@/components/ui/pointer-highlight";
import Hero from "@/components/sections/hero";

import Homepage from "@/components/sections/homepage";

import Link from "next/link";
import { useState } from "react";
import { PRODUCTS } from "@/lib/products";
import { DESIGNS } from "@/lib/designs";

const CATEGORY_SHOWCASE = [
  {
    slug: "oversized-tees",
    label: "Oversized Tees",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "classic-tees",
    label: "Classic Tees",
    image:
      "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "polo",
    label: "Polo Shirts",
    image:
      "https://images.unsplash.com/photo-1610384104075-e05c8b220e2b?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "hoodies",
    label: "Hoodies",
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop",
  },
  {
    slug: "sweatshirts",
    label: "Sweatshirts",
    image:
      "https://images.unsplash.com/photo-1614251055880-ee96e4803393?q=80&w=600&auto=format&fit=crop",
  },
];

export default function Home() {
  return (
    <>
      <style>{`
                .marquee-inner {
                    animation: marqueeScroll linear infinite;
                }

                @keyframes marqueeScroll {
                    0% {
                        transform: translateX(0%);
                    }

                    100% {
                        transform: translateX(-50%);
                    }
                }
            `}</style>

      <Hero />
      <Homepage />

      {/* -------------- */}

      {/* ------------- */}

      <div className="bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
              Shop By Category
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold text-neutral-900 mt-2">
              Find your fit
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {CATEGORY_SHOWCASE.map((c) => (
              <a
                key={c.slug}
                href={`/shop?category=${c.slug}`}
                className="group relative rounded-xl overflow-hidden aspect-[3/4]"
              >
                <img
                  src={c.image}
                  alt={c.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-white font-semibold text-sm md:text-base">
                    {c.label}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* -------------- */}

      <div className="bg-neutral-50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
              Popular Designs
            </p>
            <h2 className="text-2xl md:text-4xl font-semibold text-neutral-900 mt-2">
              Don't want to start from a blank shirt?
            </h2>
            <p className="text-neutral-500 mt-2 max-w-xl mx-auto">
              Pick a print from our gallery and put it straight on a garment
              — colour and size are up to you.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {DESIGNS.slice(0, 6).map((d) => (
              <Link
                key={d.id}
                href={`/customize?designSrc=${encodeURIComponent(d.src)}&designName=${encodeURIComponent(d.name)}`}
                className="group"
              >
                <div className="relative overflow-hidden rounded-xl bg-white aspect-square border border-neutral-200 group-hover:border-neutral-400 transition-colors">
                  <img
                    src={d.src}
                    alt={d.name}
                    className="w-full h-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-neutral-700 text-center truncate">
                  {d.name}
                </p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/shop?view=designs"
              className="text-sm font-semibold underline text-neutral-900"
            >
              Browse all designs →
            </Link>
          </div>
        </div>
      </div>

      <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
            
                .font-poppins {
                    font-family: 'Poppins', sans-serif;
                }
            `}</style>

      <div className="flex items-center justify-between max-w-6xl mx-auto px-4 mb-10">
        <div>
          <h1 className="text-3xl font-medium text-slate-800 font-poppins">
            New Arrivals
          </h1>
          <p className="text-slate-600 font-poppins mt-1">
            Explore the latest additions to our collection.
          </p>
        </div>
        <Link
          href="/shop"
          className="hidden sm:inline-flex text-sm font-semibold underline text-neutral-900"
        >
          View all products →
        </Link>
      </div>
      <section className="flex flex-wrap items-start justify-center gap-6 px-4">
        {PRODUCTS.slice(0, 4).map((p) => (
          <Link href={`/customize?product=${p.id}`} key={p.id} className="group w-56">
            <div className="relative overflow-hidden rounded-lg">
              <img
                className="w-full group-hover:shadow-xl hover:-translate-y-0.5 duration-300 transition-all h-72 object-cover object-top"
                src={p.image}
                alt={p.name}
              />
              {p.tag && (
                <span className="absolute top-2 left-2 bg-neutral-900 text-white text-[10px] font-semibold px-2 py-1 rounded-full">
                  {p.tag}
                </span>
              )}
            </div>
            <p className="text-sm mt-2">{p.name}</p>
            <p className="text-lg font-semibold">
              ₹{p.price}
              {p.compareAt && (
                <span className="text-xs text-neutral-400 line-through ml-2">
                  ₹{p.compareAt}
                </span>
              )}
            </p>
          </Link>
        ))}
      </section>
      <div className="flex justify-center mt-8 sm:hidden">
        <Link href="/shop" className="text-sm font-semibold underline">
          View all products →
        </Link>
      </div>

      <ShopByDesignBanner />
      <Sectiontestimonial />

      <FAQ />
    </>
  );
}
const ShopByDesignBanner = () => {
  return (
    <div className="bg-neutral-900 py-14 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            New
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mt-1">
            Have your own artwork? Or want ours?
          </h2>
          <p className="text-neutral-400 mt-2 max-w-md">
            Upload your own design, or shop our whole print gallery and see
            it on a shirt instantly.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/shop?view=designs"
            className="bg-white text-neutral-900 text-sm font-semibold px-6 py-3 rounded-full hover:bg-neutral-200 transition-colors"
          >
            Browse Designs
          </Link>
          <Link
            href="/customize"
            className="border border-white/30 text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
          >
            Upload Your Own
          </Link>
        </div>
      </div>
    </div>
  );
};

const Sectiontestimonial = () => {
  const testimonials = [
    {
      text: "Ordered matching hoodies for my whole team — the 3D preview looked exactly like what showed up. Print quality is genuinely great.",
      name: "Priya Sharma",
      role: "Ordered a custom hoodie",
      image:
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
    },
    {
      text: "I uploaded my own artwork and could actually see it on the shirt before paying. No more guessing how a print will turn out.",
      name: "Aarav Thapa",
      role: "Ordered a custom tee",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
    },
    {
      text: "Got 30 tees printed for a college fest. Bulk order was easy to sort out and everything arrived on time.",
      name: "Sneha Gurung",
      role: "Bulk order, college fest",
      image:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60",
    },
    {
      text: "The oversized tee fits exactly like the size guide said it would, and the print hasn't faded after multiple washes.",
      name: "Rohan Karki",
      role: "Ordered an oversized tee",
      image:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&h=100&auto=format&fit=crop",
    },
  ];

  return (
    <>
      <style>
        {`
                    @import url('https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap');
                    *{
                        font-family: "Geist", sans-serif;
                    }
                `}
      </style>

      <section className="bg-zinc-100 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-medium text-neutral-800">
              What customers say
            </h1>
            <p className="text-base/6 text-neutral-600 max-w-sm mt-2 mx-auto md:mx-0">
              Real feedback from people who've ordered custom prints, straight
              off our reviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-5">
            {/* Image Card - spans 2 rows */}
            <div className="md:row-span-2 relative rounded-lg overflow-hidden mx-auto md:mx-0 w-80">
              <img
                src="https://images.unsplash.com/photo-1503341504253-dff4815485f1?q=80&w=600&auto=format&fit=crop"
                alt="Customer wearing a custom printed hoodie"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-white/10 rounded-b-lg backdrop-blur-sm p-5">
                <div className="flex gap-1.5 mb-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <svg
                        key={i}
                        width="17"
                        height="17"
                        viewBox="0 0 17 17"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.435.693c.3-.922 1.603-.922 1.902 0l1.294 3.982a1 1 0 0 0 .951.691h4.188c.968 0 1.371 1.24.588 1.81l-3.388 2.46a1 1 0 0 0-.364 1.118l1.294 3.983c.3.921-.755 1.687-1.538 1.118l-3.388-2.462a1 1 0 0 0-1.176 0L4.41 15.856c-.784.57-1.838-.197-1.539-1.118l1.294-3.983a1 1 0 0 0-.363-1.118L.414 7.175c-.784-.569-.38-1.809.588-1.809H5.19a1 1 0 0 0 .95-.69z"
                          fill="#fff7ed"
                        />
                      </svg>
                    ))}
                </div>
                <p className="text-sm/5.5 text-neutral-50">
                  Ordered a hoodie with my own design on it — fit and print
                  quality both exceeded what I expected for the price.
                </p>
              </div>
            </div>

            {/* 4 Testimonial Cards */}
            {testimonials.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg hover:shadow-sm transition-all duration-300 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex gap-1.5 mb-4">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <svg
                          key={i}
                          width="17"
                          height="17"
                          viewBox="0 0 17 17"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M7.435.693c.299-.922 1.602-.922 1.902 0l1.294 3.982a1 1 0 0 0 .95.691h4.189c.968 0 1.371 1.24.588 1.81l-3.389 2.461a1 1 0 0 0-.363 1.118l1.294 3.983c.3.921-.755 1.687-1.539 1.118l-3.387-2.462a1 1 0 0 0-1.176 0L4.41 15.856c-.784.57-1.838-.197-1.539-1.118l1.294-3.983a1 1 0 0 0-.363-1.118L.414 7.175c-.784-.569-.38-1.809.588-1.809H5.19a1 1 0 0 0 .95-.69z"
                            fill="#ff8904"
                          />
                        </svg>
                      ))}
                  </div>
                  <p className="text-sm/5.5 text-neutral-600">{item.text}</p>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="size-11 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-800">
                      {item.name}
                    </p>
                    <p className="text-sm text-neutral-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index: any) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "How long does printing and delivery take?",
      answer:
        "Custom prints are made to order, so please allow 3-5 business days for printing, plus delivery time based on your location. We'll confirm an estimated delivery date when we reach out after you place your order.",
    },
    {
      question: "What file formats can I upload?",
      answer:
        "PNG, JPG, and SVG all work. For the sharpest print, upload the highest-resolution image you have — a transparent-background PNG usually gives the cleanest result.",
    },
    {
      question: "Is there a minimum order quantity?",
      answer:
        "No minimum for individual orders — order just one shirt if that's all you need. For bulk or corporate orders (20+ pieces), mention the quantity on the Contact page for custom pricing.",
    },
    {
      question: "What printing method do you use?",
      answer:
        "We use DTF (Direct-to-Film) printing, which holds up well to washing and works on a wide range of fabric colors, including dark garments.",
    },
    {
      question: "Can I print on both the front and back?",
      answer:
        "Yes — the customizer lets you add a design to the front and back independently. Printing both sides adds an additional print fee, shown in the price breakdown before you add to cart.",
    },
    {
      question: "What sizes are available?",
      answer:
        "S through 2XL across all our garment categories. If you're unsure which size to pick, our oversized tees are designed to run roomy — check the fit description on each product.",
    },
    {
      question: "Can I return or exchange a custom print?",
      answer:
        "Since every custom item is printed specifically for your order, we can't accept returns for a change of mind. If there's a print defect or the wrong item arrives, contact us and we'll make it right.",
    },
    {
      question: "How do I track my order?",
      answer:
        "We'll reach out by phone or email after you place your order to confirm details and keep you posted as it moves through printing and shipping.",
    },
  ];

  return (
    <>
      <style>
        {`
                    @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap");
                    * {
                        font-family: "Poppins", sans-serif;
                    }
                `}
      </style>

      <section className="w-full flex flex-col items-center justify-center py-16 px-4">
        <div className="w-full max-w-5xl">
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-neutral-900 text-center md:text-start mb-4">
              Most asked FAQ's
            </h2>
            <p className="text-neutral-800 max-w-[416px] text-sm text-center md:text-start mx-auto md:mx-0">
              We're here to help you and solve doubts. Find answers to the most
              common questions below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                onClick={() => toggleFAQ(index)}
                className={`bg-slate-50 p-3.5 rounded-lg cursor-pointer transition-all duration-300 border border-slate-200 hover:bg-slate-100 ${openIndex === index ? "row-span-2" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-800">
                    {faq.question}
                  </span>
                  <div
                    className={`text-slate-400 p-1 rounded transition-colors ${openIndex === index ? "bg-slate-200 text-slate-500" : "hover:bg-slate-300 hover:text-slate-500"}`}
                  >
                    {openIndex === index ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-minus"
                      >
                        <path d="M5 12h14" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-plus"
                      >
                        <path d="M5 12h14" />
                        <path d="M12 5v14" />
                      </svg>
                    )}
                  </div>
                </div>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${openIndex === index ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
