"use client";

import { PointerHighlight } from "@/components/ui/pointer-highlight";
import Hero from "@/components/sections/hero";

import Homepage from "@/components/sections/homepage";
import MessageSection from "@/components/sections/messageSection";

import Link from "next/link";
import { useState } from "react";
import { PRODUCTS } from "@/lib/products";

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

      <h1 className="text-3xl font-semibold text-center mx-auto">
        Our Latest Creations
      </h1>
      <p className="text-sm text-slate-500 text-center mt-2 max-w-lg mx-auto">
        A visual collection of our most recent works - each piece crafted with
        intention, emotion, and style.
      </p>

      <div className="flex items-center gap-6 h-[400px] w-full max-w-5xl mt-10 mx-auto">
        <div className="relative group flex-grow transition-all w-56 h-[400px] duration-500 hover:w-full">
          <img
            className="h-full w-full object-cover object-center"
            src="https://images.unsplash.com/photo-1543269865-0a740d43b90c?q=80&w=800&h=400&auto=format&fit=crop"
            alt="image"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-10 text-white bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <h1 className="text-3xl">Prompt engineers</h1>
            <p className="text-sm">
              Bridging the gap between human intent and machine understanding
              through expert prompt design.
            </p>
          </div>
        </div>
        <div className="relative group flex-grow transition-all w-56 h-[400px] duration-500 hover:w-full">
          <img
            className="h-full w-full object-cover object-right"
            src="https://images.unsplash.com/photo-1714976326351-0ecf0244f0fc?q=80&w=800&h=400&auto=format&fit=crop"
            alt="image"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-10 text-white bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <h1 className="text-3xl">Data scientists</h1>
            <p className="text-sm">
              Bridging the gap between human intent and machine understanding
              through expert prompt design.
            </p>
          </div>
        </div>
        <div className="relative group flex-grow transition-all w-56 h-[400px] duration-500 hover:w-full">
          <img
            className="h-full w-full object-cover object-center"
            src="https://images.unsplash.com/photo-1736220690062-79e12ca75262?q=80&w=800&h=400&auto=format&fit=crop"
            alt="image"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-10 text-white bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <h1 className="text-3xl">Software engineers</h1>
            <p className="text-sm">
              Bridging the gap between human intent and machine understanding
              through expert prompt design.
            </p>
          </div>
        </div>
      </div>
      {/* --------- */}

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

      <Sectiontestimonial />
      <MessageSection />

      <FAQ />
    </>
  );
}
const Sectiontestimonial = () => {
  const testimonials = [
    {
      text: "Rad.Clo allowed our team to move quickly and confidently - clean design, solid structure, and ready for production.",
      name: "Cristofer Levin",
      role: "Frontend engineer",
      image:
        "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200",
    },
    {
      text: "Using Rad.Clo saved us time while keeping the design sharp and consistent. These components are built for real products.",
      name: "Jason Kim",
      role: "Product designer",
      image:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200",
    },
    {
      text: "Rad.Clo struck the perfect balance between speed and quality. Every components are well crafted and production-ready.",
      name: "Michael Chen",
      role: "Backend engineer",
      image:
        "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=60",
    },
    {
      text: "We shipped faster with Rad.Clo, and the design quality never took a hit. The components feel reliable and polished.",
      name: "Sofia Martinez",
      role: "UI/UX designer",
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
              Our Testimonials
            </h1>
            <p className="text-base/6 text-neutral-600 max-w-sm mt-2 mx-auto md:mx-0">
              See what our customers are saying as they build and launch
              projects at lightning speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-5">
            {/* Image Card - spans 2 rows */}
            <div className="md:row-span-2 relative rounded-lg overflow-hidden mx-auto md:mx-0 w-80">
              <img
                src="https://assets.prebuiltui.com/images/components/feature-sections/feature-person-img.png"
                alt="Testimonial"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 size-11.5 rounded-full bg-white/40 flex items-center justify-center cursor-pointer">
                <svg
                  width="12"
                  height="14"
                  viewBox="0 0 12 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.25 13.193A1.5 1.5 0 0 1 0 11.894V1.502a1.5 1.5 0 0 1 2.25-1.3l9 5.197c1 .577 1 2.02 0 2.598z"
                    fill="#fff"
                  />
                </svg>
              </div>
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
                  Rad.Clo components helped us move faster without sacrificing
                  design quality.
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
      question: "What is included in the Starter plan?",
      answer:
        "The Starter plan includes access to all basic features, 5GB of storage, and email support. It's perfect for individuals and small projects.",
    },
    {
      question: "Do you offer a free trial?",
      answer:
        "Yes, we offer a 14-day free trial for all our plans. No credit card is required to start.",
    },
    {
      question: "Can I switch plans later?",
      answer:
        "Absolutely! You can upgrade or downgrade your plan at any time from your account settings.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal.",
    },
    {
      question: "How secure is my data?",
      answer:
        "We use industry-standard encryption and security protocols to ensure your data is safe and protected at all times.",
    },
    {
      question: "How does the 2% donation work?",
      answer:
        "We pledge to donate 2% of our annual revenue to environmental causes and non-profit organizations.",
    },
    {
      question: "Can I integrate this platform with other tools?",
      answer:
        "Yes, we offer seamless integration with popular tools like Slack, Trello, and Google Workspace.",
    },
    {
      question: "What makes your platform different?",
      answer:
        "Our platform is built with a focus on user experience, speed, and reliability, ensuring you get the best results with minimal effort.",
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
