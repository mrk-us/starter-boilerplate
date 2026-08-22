/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@repo/ui"],
	images: {
		remotePatterns: [{ hostname: "images.unsplash.com" }],
	},
};

export default nextConfig;
