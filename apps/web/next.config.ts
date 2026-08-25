import type { NextConfig } from "next";

const nextConfig = {
  transpilePackages: ["@repo/ui"],
} satisfies NextConfig;

export default nextConfig;
