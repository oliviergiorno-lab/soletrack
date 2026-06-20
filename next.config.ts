import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.11'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.stockx.com",
      },
    ],
  },
};

export default nextConfig;
