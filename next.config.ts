import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Standard Tailwind PostCSS pipeline; avoid a custom process-spawning CSS loader.
};

export default nextConfig;
