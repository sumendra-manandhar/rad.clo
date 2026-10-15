import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict Mode's dev-only double mount makes React Three Fiber force-lose
  // the 3D canvas's WebGL context ~0.5s after load (the shirt vanishes).
  // Production is unaffected either way.
  reactStrictMode: false,
};

export default nextConfig;
