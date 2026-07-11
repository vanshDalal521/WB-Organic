/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wb/types", "@wb/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;