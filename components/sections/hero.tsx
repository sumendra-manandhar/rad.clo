"use client";

import React, { useState } from "react";
import Link from "next/link";
// import Navbar from "./components/Navbar";
import TShirtViewer from "@/components/TShirtViewer";
// import {
//   ArrowRightIcon,
//   CopyIcon,
//   LeafIcon,
//   GearIcon,
//   PeopleIcon,
// } from "./components/Icons";

import {
  ArrowRight,
  Star,
  ShoppingBag,
  Palette,
  TrendingUp,
  Zap,
  ArrowRightIcon,
  CopyIcon,
  LeafIcon,
} from "lucide-react";
import { PointerHighlight } from "@/components/ui/pointer-highlight";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
// ── Data ──────────────────────────────────────────────────────────────────────
const COLORS = [
  { hex: "#ffffff", label: "White" },
  { hex: "#6F7573", label: "Charcoal" },
  { hex: "#393939", label: "Black" },
  { hex: "#476748", label: "Mint" },
  { hex: "#1E334D", label: "Blue" },
  { hex: "#662735", label: "Red" },
];

const SIZES = ["S", "M", "L", "XL", "2X"];

const FEATURES = [
  { icon: <CopyIcon />, title: "PREMIUM QUALITY", sub: "Soft touch fabric" },
  { icon: <LeafIcon />, title: "COMFORT FIT", sub: "Breathable & relaxed" },
  { icon: <CopyIcon />, title: "UNIQUE DESIGN", sub: "Trending prints" },
  { icon: <CopyIcon />, title: "PREMIUM QUALITY", sub: "Made for everyone" },
];

const categories = [
  {
    name: "Face Wash",
    img: "https://readymadeui.com/images/face-wash-category.webp",
    alt: "Face wash category with up to 50 percent discount",
    discount: "Up to 50% off",
  },
  {
    name: "Skin Glow",
    img: "https://readymadeui.com/images/skin-glow-category.webp",
    alt: "Skin glow products category with up to 50 percent discount",
    discount: "Up to 50% off",
  },
  {
    name: "Face Primer",
    img: "https://readymadeui.com/images/face-primer-category.webp",
    alt: "Face primer category with up to 50 percent discount",
    discount: "Up to 50% off",
  },
];

const features = [
  {
    title: "Grow Your Traffic",
    description:
      "Boost your website traffic, sales, visits and overall product revenue.",
    image:
      "https://assets.prebuiltui.com/images/components/feature-sections/features-graphs-image.png",
    alt: "graph",
    hasTrending: true,
    imageClass: "max-w-56",
  },
  {
    title: "Team-Friendly Structure",
    description:
      "Organize components, variants and layouts that works perfectly for teams.",
    image:
      "https://assets.prebuiltui.com/images/components/feature-sections/features-dash-img.png",
    alt: "dash",
    hasTrending: false,
  },
  {
    title: "Seamless Integration",
    description:
      "Works effortlessly with React, Next.js, Vue and modern technologies.",
    image:
      "https://assets.prebuiltui.com/images/components/feature-sections/features-social-image.png",
    alt: "socialCircle",
    hasTrending: false,
    imageClass: "max-w-60",
  },
];

// ── App ───────────────────────────────────────────────────────────────────────
export default function Hero() {
  const [activeColor, setActiveColor] = useState("#ffffff");
  const [activeSize, setActiveSize] = useState("M");

  const selectedColorLabel = COLORS.find((c) => c.hex === activeColor)?.label;

  return (
    <>
      <div className="min-h-screen" style={{ background: "#eef2f7" }}>
        {/* <Navbar /> */}

        {/* ── Hero ── */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div
            className="flex items-stretch gap-6"
            style={{ minHeight: "78vh" }}
          >
            {/* ── Left: copy + features ── */}
            <div
              className="flex flex-col justify-center shrink-0"
              style={{ width: "350px" }}
            >
              <h1
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(36px, 4vw, 54px)",
                  lineHeight: 1.05,
                  color: "#111",
                  letterSpacing: "-1.5px",
                }}
              >
                WEAR YOUR
              </h1>
              <h2
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(26px, 3vw, 40px)",
                  lineHeight: 1.1,
                  color: "#111",
                  letterSpacing: "-0.5px",
                  marginTop: "4px",
                }}
              >
                STORY OUT LOUD.
              </h2>

              <PointerHighlight>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "13px",
                    letterSpacing: "0.06em",
                    color: "#222",
                    margin: "12px",
                  }}
                >
                  <span className=""> YOUR VISION, EXPERTLY CRAFTED.</span>
                </p>
              </PointerHighlight>

              {/* Divider */}
              <div
                style={{
                  width: "210px",
                  height: "1.5px",
                  background: "#222",
                  margin: "14px 0",
                }}
              />

              <p
                style={{
                  fontSize: "13px",
                  color: "#555",
                  lineHeight: 1.75,
                  maxWidth: "280px",
                }}
              >
                Design Custom Apparel, Accessories, And Gifts In Three Simple
                Steps: Upload Your Artwork, Customize Your Text, And Receive
                Premium-Grade Prints Delivered Directly To Your Door.
              </p>

              {/* Feature icons */}
              <div className="flex gap-3 mt-8">
                {FEATURES.map((f, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center flex-1"
                  >
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        border: "2px solid #222",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "8px",
                      }}
                    >
                      {f.icon}
                    </div>
                    <p
                      style={{
                        fontSize: "9.5px",
                        fontWeight: 700,
                        lineHeight: 1.3,
                        color: "#111",
                      }}
                    >
                      {f.title}
                    </p>
                    <p
                      style={{
                        fontSize: "9.5px",
                        color: "#666",
                        marginTop: "3px",
                        lineHeight: 1.3,
                      }}
                    >
                      {f.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Center: 3D shirt ── */}
            <div
              className="flex-1 relative rounded-2xl overflow-hidden"
              style={{ minHeight: "500px" }}
            >
              {/* Dot-grid background */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  // backgroundImage:
                  //   "radial-gradient(circle, #b8c8d8 1.2px, transparent 1.2px)",
                  backgroundSize: "22px 22px",
                  opacity: 0.65,
                  borderRadius: "16px",
                }}
              />
              {/* Canvas */}
              <div
                style={{ position: "relative", width: "100%", height: "100%" }}
              >
                <TShirtViewer color={activeColor} />
              </div>
              {/* Hint */}
              <div
                style={{
                  position: "absolute",
                  bottom: "14px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "11px",
                  color: "#999",
                  letterSpacing: "0.06em",
                  pointerEvents: "none",
                  whiteSpace: "nowrap",
                }}
              >
                Drag to rotate · Scroll to zoom
              </div>
            </div>

            {/* ── Right: Size & Color ── */}
            <div
              className="flex flex-col justify-center shrink-0"
              style={{ width: "220px" }}
            >
              {/* Size */}
              <div className="mb-8">
                <h3
                  className=" text-right mb-4"
                  style={{
                    fontWeight: 900,
                    fontSize: "18px",
                    letterSpacing: "0.08em",
                  }}
                >
                  SIZE
                </h3>
                <div className="flex  gap-2 justify-center">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveSize(s)}
                      style={{
                        border: `1.5px solid ${activeSize === s ? "#222" : "#ccc"}`,
                        background: activeSize === s ? "#222" : "white",
                        color: activeSize === s ? "white" : "#222",
                        padding: "6px 14px",
                        fontSize: "13px",
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        borderRadius: "2px",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p
                  className="text-right mt-3 cursor-pointer"
                  style={{
                    fontSize: "11px",
                    textDecoration: "underline",
                    color: "#444",
                  }}
                >
                  Size Guide
                </p>
              </div>

              {/* Colors */}
              <div className="mb-8">
                <h3
                  className="text-right mb-4"
                  style={{
                    fontWeight: 900,
                    fontSize: "18px",
                    letterSpacing: "0.08em",
                  }}
                >
                  COLORS
                </h3>
                <div
                  className="grid grid-cols-3 gap-3"
                  style={{ justifyItems: "center" }}
                >
                  {COLORS.map((c) => (
                    <div
                      key={c.hex}
                      className="flex flex-col items-center gap-1"
                    >
                      <button
                        onClick={() => setActiveColor(c.hex)}
                        title={c.label}
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "5px",
                          background: c.hex,
                          border:
                            activeColor === c.hex
                              ? "3px solid #222"
                              : c.hex === "#ffffff"
                                ? "1.5px solid #ddd"
                                : "3px solid transparent",
                          cursor: "pointer",
                          transition: "border-color 0.15s, transform 0.15s",
                          transform:
                            activeColor === c.hex ? "scale(1.08)" : "scale(1)",
                          boxShadow:
                            activeColor === c.hex
                              ? "0 2px 8px rgba(0,0,0,0.18)"
                              : "none",
                        }}
                      />
                      <span
                        style={{
                          fontSize: "9px",
                          color: "#555",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontWeight: 500,
                        }}
                      >
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <Link
                href={`/customize?color=${encodeURIComponent(activeColor)}&size=${activeSize}`}
                style={{
                  background: "#1a1a1a",
                  color: "white",
                  padding: "16px 22px",
                  borderRadius: "50px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  border: "none",
                  transition: "background 0.2s, transform 0.1s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#333")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#1a1a1a")
                }
              >
                DESIGN YOUR PRODUCT
                <ArrowRightIcon />
              </Link>

              {/* Selection summary */}
              <p
                className="text-center mt-3"
                style={{ fontSize: "11px", color: "#888" }}
              >
                Size: <strong style={{ color: "#333" }}>{activeSize}</strong>
                {"  ·  "}Color:{" "}
                <strong
                  style={{
                    color: activeColor === "#ffffff" ? "#aaa" : activeColor,
                    textShadow:
                      activeColor === "#ffffff"
                        ? "none"
                        : "0 0 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {selectedColorLabel}
                </strong>
              </p>
            </div>
          </div>
        </div>

        {/* How it Works */}

        <section className="bg-black py-16 px-4">
          <div className="flex items-center flex-col justify-center text-center">
            <button className="bg-neutral-800 text-sm text-white/80 px-6 py-2.5 rounded-full">
              Our core features
            </button>
            <h2 className="text-white font-medium text-4xl md:text-[40px] mt-6">
              Every product needs consistency.
            </h2>
            <p className="text-base text-white/60 max-w-lg mt-2">
              Our Tailwind CSS components help you ship beautiful interfaces
              without reinventing the wheel.
            </p>
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-neutral-900 border border-neutral-800 rounded-2xl hover:-translate-y-3 transition duration-300 p-6 flex flex-col"
                >
                  {feature.hasTrending && (
                    <div className="bg-[#262626] px-2 py-1 rounded-full flex items-center gap-1.5 w-fit ml-auto mb-4">
                      {/* <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="#00A63E"
                      stroke="#00A63E"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trending-up-icon lucide-trending-up"
                    >
                      <path d="M16 7h6v6" />
                      <path d="m22 7-8.5 8.5-5-5L2 17" />
                    </svg> */}
                      <p className="text-xs text-white/80">45%</p>
                    </div>
                  )}
                  <div
                  //   className={`flex-1 flex items-center justify-center
                  //     ${feature.imageContainerClass}`}
                  >
                    <img
                      className={`w-full object-contain ${feature.imageClass}`}
                      src={feature.image}
                      alt={feature.alt}
                    />
                  </div>
                  <h3 className="text-base font-medium text-white mt-8 text-left">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/50 mt-2 text-left max-w-2xs mb-4">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="flex flex-col overflow-hidden">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-black dark:text-white">
                Unleash the power of <br />
                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                  Scroll Animations
                </span>
              </h1>
            </>
          }
        >
          <img
            src={`/linear.webp`}
            alt="hero"
            height={720}
            width={1400}
            className="mx-auto rounded-2xl object-cover h-full object-left-top"
            draggable={false}
          />
        </ContainerScroll>
      </div>
    </>
  );
}
