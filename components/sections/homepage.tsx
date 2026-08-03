"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Palette, Upload, Eye, Truck } from "lucide-react";

const STEPS = [
  {
    icon: Palette,
    title: "1. Pick a garment",
    desc: "Oversized tees, classic tees, polos, hoodies or sweatshirts — in the colour and size you want.",
  },
  {
    icon: Upload,
    title: "2. Add your design",
    desc: "Upload your own artwork or pick a print from our gallery — front, back, or both.",
  },
  {
    icon: Eye,
    title: "3. Preview it live",
    desc: "See exactly how it'll look in 3D before you order — no surprises when it arrives.",
  },
  {
    icon: Truck,
    title: "4. We print & ship",
    desc: "High-quality DTF printing, made to order and shipped straight to your door.",
  },
];

export default function Homepage() {
  const [stopScroll, setStopScroll] = useState(false);
  const cardData = [
    {
      title: "Your Design, Your Rules",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&auto=format&fit=crop&q=60",
    },
    {
      title: "Upload Art. Preview Live. Order.",
      image:
        "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=1200&auto=format&fit=crop&q=60",
    },
    {
      title: "Streetwear Made Personal",
      image:
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&auto=format&fit=crop&q=60",
    },
    {
      title: "Premium Prints, Every Time",
      image:
        "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&auto=format&fit=crop&q=60",
    },
  ];

  return (
    <section className="w-full bg-white py-16 lg:py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
            How It Works
          </p>
          <h2 className="text-2xl md:text-4xl font-semibold text-neutral-900 mt-2">
            From blank tee to your design, in minutes
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="text-center">
                <div className="w-14 h-14 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="text-center mb-8">
          <Link
            href="/customize"
            className="inline-block bg-neutral-900 text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-neutral-700 transition-colors"
          >
            Start Designing →
          </Link>
        </div>

        <div
          className="overflow-hidden w-full relative max-w-6xl mx-auto mt-12 rounded-2xl"
          onMouseEnter={() => setStopScroll(true)}
          onMouseLeave={() => setStopScroll(false)}
        >
          <div className="absolute left-0 top-0 h-full w-16 md:w-24 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
          <div
            className="marquee-inner flex w-fit"
            style={{
              animationPlayState: stopScroll ? "paused" : "running",
              animationDuration: cardData.length * 2500 + "ms",
            }}
          >
            <div className="flex">
              {[...cardData, ...cardData].map((card, index) => (
                <div
                  key={index}
                  className="w-56 mx-3 h-64 relative group hover:scale-95 transition-all duration-300 rounded-xl overflow-hidden"
                >
                  <img
                    src={card.image}
                    alt="card"
                    className="w-full h-full object-cover"
                  />
                  <div className="flex items-center justify-center px-4 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute bottom-0 backdrop-blur-md left-0 w-full h-full bg-black/30">
                    <p className="text-white text-base font-semibold text-center">
                      {card.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 h-full w-16 md:w-24 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>
    </section>
  );
}
