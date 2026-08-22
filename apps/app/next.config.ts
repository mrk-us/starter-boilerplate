import type { NextConfig } from "next";

const nextConfig = {
  reactCompiler: true,
  transpilePackages: ["@repo/ui"],
} satisfies NextConfig;

export default nextConfig;
