import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.us-east-1.amazonaws.com',
        pathname: '/catipult.ai.quickmail-reports/**',
      },
    ],
  },
};

export default nextConfig;
