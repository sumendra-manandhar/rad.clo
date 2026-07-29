"use client";

import React, { useState } from "react";
import Link from "next/link";

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
    <>
      <div className="w-screen min-h-screen flex justify-center items-center">
        <section className="relative w-full h-screen overflow-hidden bg-background flex flex-col items-center justify-center text-center px-4">
          {/* Badge */}
          <div className="mb-4 inline-block rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
            Join over 100,000 happy creators
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
            Engage Audiences
            <br />
            with Stunning Videos
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Boost Your Brand with High-Impact Short Videos from our expert
            content creators. Our team is ready to propel your business forward.
          </p>

          {/* CTA */}
          <button className="mt-8 px-8 py-3 rounded-full bg-red-500 text-white font-semibold shadow-lg transition-colors hover:bg-red-600">
            Get Started
          </button>

          <div
            className="overflow-hidden w-full relative max-w-6xl mx-auto mt-16"
            onMouseEnter={() => setStopScroll(true)}
            onMouseLeave={() => setStopScroll(false)}
          >
            <div className="absolute left-0 top-0 h-full w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
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
                    className="w-56 mx-4 h-[20rem] relative group hover:scale-90 transition-all duration-300"
                  >
                    <img
                      src={card.image}
                      alt="card"
                      className="w-full h-full object-cover"
                    />
                    <div className="flex items-center justify-center px-4 opacity-0 group-hover:opacity-100 transition-all duration-300 absolute bottom-0 backdrop-blur-md left-0 w-full h-full bg-black/20">
                      <p className="text-white text-lg font-semibold text-center">
                        {card.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute right-0 top-0 h-full w-20 md:w-40 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />
          </div>

          {/* Image Strip */}
          {/* <div className="absolute bottom-0 left-0 w-full h-1/3 md:h-2/5 overflow-hidden">
            <div className="flex gap-4 animate-marquee px-4">
              {[
                "https://images.unsplash.com/photo-1756312148347-611b60723c7a?w=900&auto=format&fit=crop&q=60",
                "https://images.unsplash.com/photo-1757865579201-693dd2080c73?w=900&auto=format&fit=crop&q=60",
                "https://images.unsplash.com/photo-1756786605218-28f7dd95a493?w=900&auto=format&fit=crop&q=60",
                "https://images.unsplash.com/photo-1757519740947-eef07a74c4ab?w=900&auto=format&fit=crop&q=60",
              ].map((src, i) => (
                <div
                  key={i}
                  className={`relative aspect-[3/4] h-48 md:h-64 flex-shrink-0 ${
                    i % 2 === 0 ? "-rotate-2" : "rotate-3"
                  }`}
                >
                  <img
                    src={src}
                    alt={`Showcase ${i + 1}`}
                    className="w-full h-full object-cover rounded-2xl shadow-md"
                  />
                </div>
              ))}
            </div>
          </div> */}
        </section>
      </div>
    </>
  );
}
