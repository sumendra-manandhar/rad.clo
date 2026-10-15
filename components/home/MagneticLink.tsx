"use client";

import { useRef } from "react";
import Link from "next/link";

/** A link that drifts toward the cursor while it's nearby. */
export default function MagneticLink({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
  };
  const reset = () => ref.current && (ref.current.style.transform = "");
  return (
    <Link
      ref={ref}
      href={href}
      onPointerMove={move}
      onPointerLeave={reset}
      className={`inline-flex transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </Link>
  );
}
