/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@repo/ui"],
	reactCompiler: true,
	images: {
		remotePatterns: [{ hostname: "images.unsplash.com" }],
	},
};

export default nextConfig;
