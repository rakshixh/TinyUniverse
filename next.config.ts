import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable strict mode for better React practices
  reactStrictMode: true,

  // Image optimization — allow Vercel Blob hostnames
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        // Local development blob emulation
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      },
    ],
  },

  // SASS configuration
  sassOptions: {
    includePaths: ['./src/styles'],
  },
};

export default nextConfig;
