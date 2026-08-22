import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [{ hostname: "images.unsplash.com" }],
  },
  transpilePackages: ["@repo/ui"],
} satisfies NextConfig;

export default nextConfig;
